import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { prismaPlugin } from './plugins/prisma';
import { jwtPlugin } from './plugins/jwt';
import { swaggerPlugin } from './plugins/swagger';
import { AppError } from './lib/errors';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { productsRoutes } from './modules/products/products.routes';
import { cartRoutes } from './modules/cart/cart.routes';
import { ordersRoutes } from './modules/orders/orders.routes';
import { env } from './config/env';

export async function buildApp() {
  const app = Fastify({ logger: env.NODE_ENV !== 'test' }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError | AppError | ZodError, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ message: error.message });
      return;
    }

    if (error instanceof ZodError) {
      reply.code(400).send({ message: 'Invalid data.', issues: error.issues });
      return;
    }

    if (error.validation) {
      reply.code(400).send({ message: 'Invalid data.', issues: error.validation });
      return;
    }

    request.log.error(error);
    reply.code(500).send({ message: 'Internal server error.' });
  });

  await app.register(cors);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);

  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(categoriesRoutes);
  await app.register(productsRoutes);
  await app.register(cartRoutes);
  await app.register(ordersRoutes);

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
