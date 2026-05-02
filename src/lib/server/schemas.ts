import { z } from 'zod';

export const listingSearchSchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createBookingSchema = z.object({
  listingId: z.string().uuid(),
  dateFrom: z.string(),
  dateTo: z.string(),
});

export const createListingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  city: z.string().min(2),
  pricePerNight: z.coerce.number().positive(),
});
