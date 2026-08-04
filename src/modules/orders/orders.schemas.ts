import { z } from 'zod';

export const orderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELED',
]);

export const updateOrderStatusBodySchema = z.object({
  status: orderStatusEnum,
});
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;

export const orderParamsSchema = z.object({
  id: z.string().uuid(),
});

export const orderListQuerySchema = z.object({
  all: z.coerce.boolean().optional().default(false),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

const orderItemResponseSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  product: z.object({
    id: z.string().uuid(),
    name: z.string(),
    imageUrl: z.string().nullable(),
  }),
});

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: orderStatusEnum,
  totalCents: z.number().int(),
  createdAt: z.date(),
  items: z.array(orderItemResponseSchema),
});
