import { z } from 'zod';

// Ticket tier schema for tiered ticketing
export const ticketTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required').max(100, 'Tier name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional()
});

// Event creation schema
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  time: z.string().optional(),
  ticketTiers: z.array(ticketTierSchema).min(1, 'At least one ticket tier is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  itinerary: z.array(z.object({
    time: z.string(),
    activity: z.string().min(1, 'Activity description required'),
    location: z.string().optional()
  })).optional(),
  tags: z.array(z.string()).optional()
});

// Event update schema
export const updateEventSchema = createEventSchema.partial();

// Message creation schema
export const createMessageSchema = z.object({
  senderId: z.number().int().positive('Invalid sender ID'),
  receiverId: z.number().int().positive('Invalid receiver ID'),
  content: z.string().min(1, 'Message content is required').max(1000, 'Message too long')
});

// User registration schema
export const userRegistrationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long').optional(),
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Invalid age').optional(),
  location: z.string().max(100, 'Location too long').optional()
});

// Pagination schema
export const paginationSchema = z.object({
  limit: z.string().transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) ? 20 : Math.min(Math.max(1, num), 100); // Default 20, max 100
  }).optional().default('20'),
  offset: z.string().transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : Math.max(0, num); // Default 0, min 0
  }).optional().default('0')
});

// User browse filters schema
export const userBrowseSchema = z.object({
  location: z.string().optional(),
  gender: z.string().optional(),
  minAge: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  maxAge: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  moods: z.union([z.string(), z.array(z.string())]).optional(),
  interests: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.string().optional()
}).merge(paginationSchema);

// Admin make admin schema
export const makeAdminSchema = z.object({
  userId: z.number().int().positive('Invalid user ID')
});