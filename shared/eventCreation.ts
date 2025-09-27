import { z } from "zod";

// Base schemas for reusable components
export const agendaItemSchema = z.object({
  time: z.string().min(1, "Time is required"),
  description: z.string().min(1, "Description is required"),
});

export const ticketTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").optional(),
});

// Comprehensive event creation schema based on Swift EventCreationData
export const eventCreationSchema = z.object({
  // Step 1: Basic Info
  title: z.string().min(3, "Title must be at least 3 characters"),
  tagline: z.string().optional(),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  
  // Step 2: Gallery
  images: z.array(z.any()).default([]), // File objects
  eventImageURL: z.string().optional(),
  imageURLs: z.array(z.string()).default([]),
  videoURLs: z.array(z.string()).default([]),
  
  // Step 3: Event Details
  isOnlineEvent: z.boolean().default(false),
  eventVisibility: z.string().default("public"),
  city: z.string().min(2, "City is required"),
  addressLine1: z.string().optional(),
  additionalInfo: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  addActivitySchedule: z.boolean().default(false),
  agendaItems: z.array(agendaItemSchema).default([]),
  
  // Step 4: Event Specifics (Optional)
  addEventLineup: z.boolean().default(false),
  eventLineup: z.array(z.number()).default([]), // User IDs
  dressCode: z.boolean().default(false),
  dressCodeDetails: z.string().optional(),
  
  // Step 5: Pricing & Audience
  isPaidEvent: z.boolean().default(false),
  ticketTiers: z.array(ticketTierSchema).default([]),
  deadline: z.coerce.date().optional(),
  eventPrivacy: z.enum(["public", "private", "friends", "rsvp"]).default("public"),
  whoShouldAttend: z.string().optional(),
  
  // Step 6: Advanced Audience Targeting
  spotsAvailable: z.string().optional(),
  promotionOnly: z.boolean().default(false),
  contactsOnly: z.boolean().default(false),
  invitationOnly: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  genderExclusive: z.string().optional(),
  ageExclusiveMin: z.coerce.number().optional(),
  ageExclusiveMax: z.coerce.number().optional(),
  moodSpecific: z.string().optional(),
  interestsSpecific: z.array(z.string()).default([]),
  vibes: z.array(z.string()).default([]),
  
  // Additional fields for compatibility
  category: z.string().default("Other"),
  capacity: z.coerce.number().optional(),
  location: z.string().optional(), // Will be derived from city + addressLine1
});

// Infer the type from the schema
export type EventCreationData = z.infer<typeof eventCreationSchema>;
export type TicketTier = z.infer<typeof ticketTierSchema>;

// Individual step schemas for validation
export const step1Schema = eventCreationSchema.pick({
  title: true,
  tagline: true,  
  summary: true,
});

export const step2Schema = eventCreationSchema.pick({
  images: true,
  eventImageURL: true,
  imageURLs: true,
  videoURLs: true,
});

export const step3Schema = eventCreationSchema.pick({
  isOnlineEvent: true,
  eventVisibility: true,
  city: true,
  addressLine1: true,
  additionalInfo: true,
  startDate: true,
  endDate: true,
  addActivitySchedule: true,
  agendaItems: true,
});

export const step4Schema = eventCreationSchema.pick({
  addEventLineup: true,
  eventLineup: true,
  dressCode: true,
  dressCodeDetails: true,
});

export const step5Schema = eventCreationSchema.pick({
  isPaidEvent: true,
  ticketTiers: true,
  deadline: true,
  eventPrivacy: true,
  whoShouldAttend: true,
});

export const step6Schema = eventCreationSchema.pick({
  spotsAvailable: true,
  promotionOnly: true,
  contactsOnly: true,
  invitationOnly: true,
  requireApproval: true,
  genderExclusive: true,
  ageExclusiveMin: true,
  ageExclusiveMax: true,
  moodSpecific: true,
  interestsSpecific: true,
  vibes: true,
});

// Type definitions for each step
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;

// Enum for event creation steps
export enum EventCreationStep {
  BasicInfo = 1,
  Gallery = 2,
  EventDetails = 3,
  EventSpecifics = 4,
  PricingAudience = 5,
  AudienceTargeting = 6,
}

// Constants for UI
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "all", label: "All genders" },
];

export const EVENT_PRIVACY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "friends", label: "Friends only" },
  { value: "rsvp", label: "RSVP Required" },
];

export const EVENT_VISIBILITY_OPTIONS = [
  { value: "public", label: "Anyone can find this event" },
  { value: "link", label: "Only people with the link" },
  { value: "invited", label: "Only invited people" },
];

export const VIBE_OPTIONS = [
  { value: "music-nightlife", label: "Music & Nightlife" },
  { value: "fashion-style", label: "Fashion & Style" },
  { value: "networking-business", label: "Networking & Business" },
  { value: "dining-drinks", label: "Dining & Drinks" },
  { value: "outdoor-nature", label: "Outdoor & Nature" },
  { value: "sport-recreation", label: "Sport & Recreation" },
  { value: "wellness-movement", label: "Wellness & Movement" },
  { value: "creative-artsy", label: "Creative & Artsy" },
  { value: "single-social", label: "Single & Social" },
  { value: "chill-recharge", label: "Chill & Recharge" },
  { value: "adventure-exploring", label: "Adventure & Exploring" },
  { value: "spiritual-intentional", label: "Spiritual & Intentional" },
  { value: "culture-travel", label: "Culture & Travel" },
  { value: "luxury-lifestyle", label: "Luxury & Lifestyle" },
  { value: "learning-growth", label: "Learning & Growth" },
  { value: "philanthropy-impact", label: "Philanthropy & Impact" },
];