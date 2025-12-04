import { z } from 'zod';

export const createReviewZodSchema = z.object({
    body: z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
    }),
});

export const updateReviewZodSchema = z.object({
    body: z.object({
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().optional(),
    }),
});
