import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { OrdersService } from './orders.service';
import {
  orderListQuerySchema,
  orderParamsSchema,
  orderResponseSchema,
  updateOrderStatusBodySchema,
} from './orders.schemas';

export async function ordersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = new OrdersService(fastify.prisma);

  app.post(
    '/orders',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['orders'],
        summary: 'Checks out an order from the current cart',
        security: [{ bearerAuth: [] }],
        response: { 201: orderResponseSchema },
      },
    },
    async (request, reply) => {
      const order = await service.checkout(request.user.id);
      reply.code(201).send(order);
    },
  );

  app.get(
    '/orders',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['orders'],
        summary: 'Lists orders (customers see their own; admins can see all with ?all=true)',
        security: [{ bearerAuth: [] }],
        querystring: orderListQuerySchema,
        response: { 200: z.array(orderResponseSchema) },
      },
    },
    async (request) => {
      if (request.query.all && request.user.role === 'ADMIN') {
        return service.listAll();
      }
      return service.listForUser(request.user.id);
    },
  );

  app.get(
    '/orders/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['orders'],
        summary: 'Fetches an order by id (order owner or admin)',
        security: [{ bearerAuth: [] }],
        params: orderParamsSchema,
        response: { 200: orderResponseSchema },
      },
    },
    async (request) => service.getById(request.params.id, request.user),
  );

  app.patch(
    '/orders/:id/status',
    {
      onRequest: [fastify.requireAdmin],
      schema: {
        tags: ['orders'],
        summary: "Updates an order's status (admin)",
        security: [{ bearerAuth: [] }],
        params: orderParamsSchema,
        body: updateOrderStatusBodySchema,
        response: { 200: orderResponseSchema },
      },
    },
    async (request) => service.updateStatus(request.params.id, request.body.status),
  );
}
