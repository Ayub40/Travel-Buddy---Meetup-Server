import { z } from 'zod';
import { TravelType } from '@prisma/client';

export const createTravelPlan = z.object({
  travelPlan: z.object({
    title: z.string({ error: "Title is required!" }),
    destination: z.string({ error: "Destination is required!" }),
    country: z.string({ error: "Country is required!" }),
    startDate: z.string({ error: "Start date is required!" }),
    endDate: z.string({ error: "End date is required!" }),
    budget: z.number().optional(),
    description: z.string().optional(),
    travelType: z.enum([TravelType.SOLO, TravelType.FAMILY, TravelType.FRIENDS]),
    photos: z.array(z.string()).optional(),
    visibility: z.boolean().optional(),
  }),
});

export const updateTravelPlan = z.object({
  travelPlan: z.object({
    title: z.string().optional(),
    destination: z.string().optional(),
    country: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budget: z.number().optional(),
    description: z.string().optional(),
    travelType: z.enum([TravelType.SOLO, TravelType.FAMILY, TravelType.FRIENDS]).optional(),
    photos: z.array(z.string()).optional(),
    visibility: z.boolean().optional(),
  }),
});

export const travelPlanValidation = {
  createTravelPlan,
  updateTravelPlan,
};
