import { z } from 'zod';

export const addCartItemBodySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;

export const updateCartItemBodySchema = z.object({
  quantity: z.number().int().positive(),
});
export type UpdateCartItemBody = z.infer<typeof updateCartItemBodySchema>;

export const cartItemParamsSchema = z.object({
  productId: z.string().uuid(),
});

const cartProductSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  priceCents: z.number().int(),
  imageUrl: z.string().nullable(),
  stock: z.number().int(),
});

export const cartItemResponseSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  product: cartProductSummarySchema,
  subtotalCents: z.number().int(),
});

export const cartResponseSchema = z.object({
  id: z.string().uuid(),
  items: z.array(cartItemResponseSchema),
  totalCents: z.number().int(),
});
