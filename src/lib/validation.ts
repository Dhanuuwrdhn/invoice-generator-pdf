import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const credentialsSchema = z.object({
  email,
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});
