import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { CartService } from './cart.service';
import {
  addCartItemBodySchema,
  cartItemParamsSchema,
  cartResponseSchema,
  updateCartItemBodySchema,
} from './cart.schemas';

export async function cartRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = new CartService(fastify.prisma);

  app.get(
    '/cart',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['cart'],
        summary: "Returns the authenticated user's cart",
        security: [{ bearerAuth: [] }],
        response: { 200: cartResponseSchema },
      },
    },
    async (request) => service.getCart(request.user.id),
  );

  app.post(
    '/cart/items',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['cart'],
        summary: 'Adds an item to the cart',
        security: [{ bearerAuth: [] }],
        body: addCartItemBodySchema,
        response: { 200: cartResponseSchema },
      },
    },
    async (request) => service.addItem(request.user.id, request.body.productId, request.body.quantity),
  );

  app.patch(
    '/cart/items/:productId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['cart'],
        summary: 'Updates the quantity of a cart item',
        security: [{ bearerAuth: [] }],
        params: cartItemParamsSchema,
        body: updateCartItemBodySchema,
        response: { 200: cartResponseSchema },
      },
    },
    async (request) => service.updateItem(request.user.id, request.params.productId, request.body.quantity),
  );

  app.delete(
    '/cart/items/:productId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['cart'],
        summary: 'Removes an item from the cart',
        security: [{ bearerAuth: [] }],
        params: cartItemParamsSchema,
        response: { 200: cartResponseSchema },
      },
    },
    async (request) => service.removeItem(request.user.id, request.params.productId),
  );

  app.delete(
    '/cart',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['cart'],
        summary: 'Empties the cart',
        security: [{ bearerAuth: [] }],
        response: { 200: cartResponseSchema },
      },
    },
    async (request) => service.clear(request.user.id),
  );
}
