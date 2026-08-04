import { z } from 'zod';

export const productCreateBodySchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid(),
});
export type ProductCreateBody = z.infer<typeof productCreateBodySchema>;

export const productUpdateBodySchema = productCreateBodySchema.partial();
export type ProductUpdateBody = z.infer<typeof productUpdateBodySchema>;

export const productParamsSchema = z.object({
  id: z.string().uuid(),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const categorySummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  stock: z.number().int(),
  imageUrl: z.string().nullable(),
  categoryId: z.string().uuid(),
  category: categorySummarySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productListResponseSchema = z.object({
  data: z.array(productResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
