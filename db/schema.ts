import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar, primaryKey, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Declare table first
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profileType: text("profile_type").default("member"), // member, business, promoter, non-profit
  gender: text("gender"), // Added for gender filtering
  sexualOrientation: text("sexual_orientation"), // Added for orientation filtering
  bio: text("bio"),
  profileImage: text("profile_image"), 
  profileImages: jsonb("profile_images").$type<string[]>().default([]), 
  location: text("location"), // Current location
  birthLocation: text("birth_location"),
  livedLocation: text("lived_location"), // Places where user has lived
  nextLocation: text("next_location"),
  phoneNumber: text("phone_number"), // User phone number
  intention: text("intention"), // dating, social, networking, friends
  interests: jsonb("interests").$type<string[]>(),
  currentMoods: jsonb("current_moods").$type<string[]>(), // Filter by mood
  profession: text("profession"),
  age: integer("age"),
  businessName: text("business_name"), // for business/promoter profiles
  businessDescription: text("business_description"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active"), // For showing active users
  isPremium: boolean("is_premium").default(false), // For premium features
  isAdmin: boolean("is_admin").default(false), // For admin access
  preferredLanguage: text("preferred_language").default("en"), // Language preference
  referralCode: text("referral_code").unique(), // For referral system
  referredBy: integer("referred_by"), // Will set up relation later to avoid circular dep
  stripeAccountId: text("stripe_account_id"), // To store the 'acct_...' ID
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(), // For city filtering
  location: text("location").notNull(), // Specific venue location
  address: text("address"), // Exact address of the event
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Geographic latitude
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Geographic longitude
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"), // Added for multi-day events

  image: text("image"), // Consolidated single image field for cover image
  videoUrls: jsonb("video_urls").$type<string[]>().default([]), // Array of video URLs

  category: text("category").notNull(),
  creatorId: integer("creator_id").references(() => users.id),
  capacity: integer("capacity"),
  price: varchar("price"), 
  ticketType: text("ticket_type").notNull(), // free, paid, donation
  availableTickets: integer("available_tickets"),
  createdAt: timestamp("created_at").defaultNow(),
  isPrivate: boolean("is_private").default(false),
  requireApproval: boolean("require_approval").default(false), // For private events requiring access approval
  isRsvp: boolean("is_rsvp").default(false), // For RSVP events requiring approval
  isBusinessEvent: boolean("is_business_event").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  attendingCount: integer("attending_count").default(0),
  interestedCount: integer("interested_count").default(0),
  viewCount: integer("view_count").default(0),
  timeFrame: text("time_frame"), // Today, This Week, This Weekend, This Month, Next Month
  stripeProductId: text("stripe_product_id"), // For payment integration
  stripePriceId: text("stripe_price_id"), // For payment integration
  itinerary: jsonb("itinerary").$type<{ startTime: string; endTime: string; description: string }[]>().default([]),
  dressCode: text("dress_code"), // Dress code for the event
});

export const ticketTiers = pgTable("ticket_tiers", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  name: text("name").notNull(), // "Basic", "VIP", "Early Bird"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity"), // Available tickets for this tier
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  userId: integer("user_id").references(() => users.id),
  ticketTierId: integer("ticket_tier_id").references(() => ticketTiers.id),
  status: text("status").notNull(), // attending, interested, not_attending
  ticketQuantity: integer("ticket_quantity").default(1),
  purchaseDate: timestamp("purchase_date"),
  ticketCode: text("ticket_code"),
  paymentStatus: text("payment_status").default("pending"), // pending, completed, refunded
  paymentIntentId: text("payment_intent_id"), // For Stripe integration
  checkInStatus: boolean("check_in_status").default(false), // For event check-in
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"), // Added for tracking checkout
  ticketIdentifier: text("ticket_identifier").unique(), // Added for unique QR code identifier
});

// New table for conversations (supports both direct and group chats)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title"), // Event name for auto-generated chats, null for direct messages
  type: text("type").notNull().default("direct"), // 'direct', 'group', 'event'
  eventId: integer("event_id").references(() => events.id), // For event-specific chats
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Join table for conversation participants
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: integer("conversation_id").references(() => conversations.id),
  userId: integer("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"), // For tracking read status
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
  };
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id), // Keep for backward compatibility
  conversationId: integer("conversation_id").references(() => conversations.id), // New field for group chat support
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  language: text("language").default("en"), // For message translation
});

// Simple contacts table - one-way relationship for building contact lists
export const userContacts = pgTable("user_contacts", {
  ownerId: integer("owner_id").references(() => users.id),
  contactId: integer("contact_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.ownerId, table.contactId] }),
  };
});

// Table for invitations/referrals
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id").references(() => users.id),
  email: text("email").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").default("pending"), // pending, accepted, expired
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  inviteeId: integer("invitee_id").references(() => users.id), // Set when accepted
});

// Table for user cities (cities user is interested in)
// Also used for tracking city suggestions from non-users
export const userCities = pgTable("user_cities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  city: text("city").notNull(),
  isCurrent: boolean("is_current").default(false),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true), // For suggestions: false = not shown in UI
  email: text("email"), // For suggestions: email to notify when city is added
  reason: text("reason"), // For suggestions: why this city should be added
  arrivalDate: timestamp("arrival_date"),
  departureDate: timestamp("departure_date"),
  createdAt: timestamp("created_at").defaultNow(),
});



// Table for storing payment details
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  eventParticipantId: integer("event_participant_id").references(
    () => eventParticipants.id,
  ), // Link to specific event ticket/participation if applicable
  stripeChargeId: text("stripe_charge_id").unique(), // From successful charge event
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique().notNull(), // From session creation
  stripeCustomerId: text("stripe_customer_id"), // Optional: If you create Stripe Customers
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull(), // e.g., 'usd'
  status: text("status").notNull(), // e.g., 'succeeded', 'pending', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for premium subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(), // Stripe subscription ID
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  status: text("status").notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  subscriptionType: text("subscription_type").default("monthly"), // monthly, yearly, etc.
  priceId: text("price_id"), // Stripe price ID
});

// Table for tracking subscription payment history
export const subscriptionPayments = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(), // Stripe invoice ID
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(), // Payment intent from Stripe
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull(), // e.g., 'usd'
  status: text("status").notNull(), // succeeded, failed, pending
  billingReason: text("billing_reason"), // e.g., 'subscription_create', 'subscription_cycle'
  periodStart: timestamp("period_start").notNull(), // Start of this billing period
  periodEnd: timestamp("period_end").notNull(), // End of this billing period
  paymentMethod: text("payment_method"), // e.g., 'card_visa_1234'
  receiptUrl: text("receipt_url"), // URL to receipt/invoice
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many, one }) => ({
  createdEvents: many(events),
  participatingEvents: many(eventParticipants),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  createdConversations: many(conversations),
  conversationParticipations: many(conversationParticipants),
  contacts: many(userContacts, { relationName: "contacts" }),
  sentInvitations: many(invitations, { relationName: "sentInvitations" }),
  referredBy: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
  userCities: many(userCities),
  subscriptions: many(subscriptions), // Add relation to subscriptions
  subscriptionPayments: many(subscriptionPayments), // Add relation to subscription payments
}));

export const eventRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
  ticketTiers: many(ticketTiers),
  conversations: many(conversations), // Add relation to event conversations
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
  participants: many(eventParticipants),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
  ticketTier: one(ticketTiers, {
    fields: [eventParticipants.ticketTierId],
    references: [ticketTiers.id],
  }),
  payment: one(payments, { // Add relation from participant to payment
    fields: [eventParticipants.stripeCheckoutSessionId],
    references: [payments.stripeCheckoutSessionId],
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// Relations for conversations
export const conversationRelations = relations(conversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
  event: one(events, {
    fields: [conversations.eventId],
    references: [events.id],
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

// Relations for conversation participants
export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

export const userContactsRelations = relations(userContacts, ({ one }) => ({
  owner: one(users, {
    fields: [userContacts.ownerId],
    references: [users.id],
    relationName: "contacts",
  }),
  contact: one(users, {
    fields: [userContacts.contactId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
    relationName: "sentInvitations",
  }),
  invitee: one(users, {
    fields: [invitations.inviteeId],
    references: [users.id],
  }),
}));

export const userCitiesRelations = relations(userCities, ({ one }) => ({
  user: one(users, {
    fields: [userCities.userId],
    references: [users.id],
  }),
}));

// Add relations for the new payments table
export const paymentRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  eventParticipant: one(eventParticipants, {
    fields: [payments.eventParticipantId],
    references: [eventParticipants.id],
  }),
}));

// Add relations for the new subscriptions table
export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payments: many(subscriptionPayments), // Add relation to subscription payments
}));

// Add relations for the new subscription payments table
export const subscriptionPaymentRelations = relations(subscriptionPayments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionPayments.subscriptionId],
    references: [subscriptions.id],
  }),
  user: one(users, {
    fields: [subscriptionPayments.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Schemas for conversations
export const insertConversationSchema = createInsertSchema(conversations);
export const selectConversationSchema = createSelectSchema(conversations);
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// Schemas for conversation participants
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants);
export const selectConversationParticipantSchema = createSelectSchema(conversationParticipants);
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;

export const insertEventParticipantSchema = createInsertSchema(eventParticipants);
export const selectEventParticipantSchema = createSelectSchema(eventParticipants);
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type NewEventParticipant = typeof eventParticipants.$inferInsert;

export const insertTicketTierSchema = createInsertSchema(ticketTiers);
export const selectTicketTierSchema = createSelectSchema(ticketTiers);
export type TicketTier = typeof ticketTiers.$inferSelect;
export type NewTicketTier = typeof ticketTiers.$inferInsert;

export const insertUserContactSchema = createInsertSchema(userContacts);
export const selectUserContactSchema = createSelectSchema(userContacts);
export type UserContact = typeof userContacts.$inferSelect;
export type NewUserContact = typeof userContacts.$inferInsert;

export const insertInvitationSchema = createInsertSchema(invitations);
export const selectInvitationSchema = createSelectSchema(invitations);
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export const insertUserCitySchema = createInsertSchema(userCities);
export const selectUserCitySchema = createSelectSchema(userCities);
export type UserCity = typeof userCities.$inferSelect;
export type NewUserCity = typeof userCities.$inferInsert;

// Zod schemas for payments
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Add schemas for subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const selectSubscriptionSchema = createSelectSchema(subscriptions);
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// Add schemas for subscription payments
export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments);
export const selectSubscriptionPaymentSchema = createSelectSchema(subscriptionPayments);
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type NewSubscriptionPayment = typeof subscriptionPayments.$inferInsert;

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  inAppMessages: boolean("in_app_messages").default(true),
  inAppEvents: boolean("in_app_events").default(true),
  inAppRsvp: boolean("in_app_rsvp").default(true),
  inAppTickets: boolean("in_app_tickets").default(true),
  pushMessages: boolean("push_messages").default(false),
  pushEvents: boolean("push_events").default(false),
  pushRsvp: boolean("push_rsvp").default(false),
  pushTickets: boolean("push_tickets").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push notification subscriptions table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences);
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions);
export const selectPushSubscriptionSchema = createSelectSchema(pushSubscriptions);
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;