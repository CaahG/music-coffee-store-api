import { z } from 'zod';

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export { slugify };

export const categoryCreateBodySchema = z.object({
  name: z.string().min(2).max(80),
});
export type CategoryCreateBody = z.infer<typeof categoryCreateBodySchema>;

export const categoryUpdateBodySchema = categoryCreateBodySchema.partial();
export type CategoryUpdateBody = z.infer<typeof categoryUpdateBodySchema>;

export const categoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});
