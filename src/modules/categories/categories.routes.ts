import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CategoriesService } from './categories.service';
import {
  categoryCreateBodySchema,
  categoryParamsSchema,
  categoryResponseSchema,
  categoryUpdateBodySchema,
} from './categories.schemas';

export async function categoriesRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = new CategoriesService(fastify.prisma);

  app.get(
    '/categories',
    {
      schema: {
        tags: ['categories'],
        summary: 'Lists all categories',
        response: { 200: z.array(categoryResponseSchema) },
      },
    },
    async () => service.list(),
  );

  app.get(
    '/categories/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Fetches a category by id',
        params: categoryParamsSchema,
        response: { 200: categoryResponseSchema },
      },
    },
    async (request) => service.getById(request.params.id),
  );

  app.post(
    '/categories',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['categories'],
        summary: 'Creates a category (admin)',
        security: [{ bearerAuth: [] }],
        body: categoryCreateBodySchema,
        response: { 201: categoryResponseSchema },
      },
    },
    async (request, reply) => {
      const category = await service.create(request.body);
      reply.code(201).send(category);
    },
  );

  app.patch(
    '/categories/:id',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['categories'],
        summary: 'Updates a category (admin)',
        security: [{ bearerAuth: [] }],
        params: categoryParamsSchema,
        body: categoryUpdateBodySchema,
        response: { 200: categoryResponseSchema },
      },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  app.delete(
    '/categories/:id',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['categories'],
        summary: 'Deletes a category (admin)',
        security: [{ bearerAuth: [] }],
        params: categoryParamsSchema,
      },
    },
    async (request, reply) => {
      await service.remove(request.params.id);
      reply.code(204).send();
    },
  );
}
