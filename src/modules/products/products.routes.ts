import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductsService } from './products.service';
import {
  productCreateBodySchema,
  productListResponseSchema,
  productParamsSchema,
  productQuerySchema,
  productResponseSchema,
  productUpdateBodySchema,
} from './products.schemas';

export async function productsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = new ProductsService(fastify.prisma);

  app.get(
    '/products',
    {
      schema: {
        tags: ['products'],
        summary: 'Lists catalog products, with filters and pagination',
        querystring: productQuerySchema,
        response: { 200: productListResponseSchema },
      },
    },
    async (request) => service.list(request.query),
  );

  app.get(
    '/products/:id',
    {
      schema: {
        tags: ['products'],
        summary: 'Fetches a product by id',
        params: productParamsSchema,
        response: { 200: productResponseSchema },
      },
    },
    async (request) => service.getById(request.params.id),
  );

  app.post(
    '/products',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['products'],
        summary: 'Creates a product (admin)',
        security: [{ bearerAuth: [] }],
        body: productCreateBodySchema,
        response: { 201: productResponseSchema },
      },
    },
    async (request, reply) => {
      const product = await service.create(request.body);
      reply.code(201).send(product);
    },
  );

  app.patch(
    '/products/:id',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['products'],
        summary: 'Updates a product (admin)',
        security: [{ bearerAuth: [] }],
        params: productParamsSchema,
        body: productUpdateBodySchema,
        response: { 200: productResponseSchema },
      },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  app.delete(
    '/products/:id',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['products'],
        summary: 'Deletes a product (admin)',
        security: [{ bearerAuth: [] }],
        params: productParamsSchema,
      },
    },
    async (request, reply) => {
      await service.remove(request.params.id);
      reply.code(204).send();
    },
  );
}
