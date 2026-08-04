import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AuthService } from './auth.service';
import { authResponseSchema, loginBodySchema, registerBodySchema } from './auth.schemas';

export async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const authService = new AuthService(fastify.prisma);

  app.post(
    '/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Registers a new customer',
        body: registerBodySchema,
        response: { 201: authResponseSchema },
      },
    },
    async (request, reply) => {
      const user = await authService.register(request.body);
      const token = app.jwt.sign({ id: user.id, role: user.role });
      reply.code(201).send({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    },
  );

  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticates a user and returns a JWT token',
        body: loginBodySchema,
        response: { 200: authResponseSchema },
      },
    },
    async (request, reply) => {
      const user = await authService.login(request.body);
      const token = app.jwt.sign({ id: user.id, role: user.role });
      reply.send({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    },
  );
}
