import { z } from 'zod';

export const registerBodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: userPublicSchema,
});
