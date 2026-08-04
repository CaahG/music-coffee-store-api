import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { userPublicSchema } from '../auth/auth.schemas';
import { NotFoundError } from '../../lib/errors';

export async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/users/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['users'],
        summary: "Returns the authenticated user's data",
        security: [{ bearerAuth: [] }],
        response: { 200: userPublicSchema },
      },
    },
    async (request) => {
      const user = await fastify.prisma.user.findUnique({ where: { id: request.user.id } });
      if (!user) {
        throw new NotFoundError('User not found.');
      }
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  );
}
