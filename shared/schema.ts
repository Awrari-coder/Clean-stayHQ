import { pgTable, text, integer, serial, timestamp, decimal, jsonb, pgEnum, boolean, time, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['host', 'cleaner', 'admin', 'cleaning_company']);
export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'checked-in', 'completed', 'cancelled']);
export const cleaningStatusEnum = pgEnum('cleaning_status', ['pending', 'scheduled', 'in-progress', 'completed', 'verified']);
export const jobStatusEnum = pgEnum('job_status', ['unassigned', 'assigned', 'accepted', 'in-progress', 'completed']);
export const paymentTypeEnum = pgEnum('payment_type', ['deposit', 'payout']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('host'),
  companyId: integer('company_id'),
  phone: text('phone'),
  avatar: text('avatar'),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationSentAt: timestamp('email_verification_sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  hostId: integer('host_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull().default('Austin'),
  state: text('state').notNull().default('TX'),
  zip: text('zip').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  airbnbPropertyId: text('airbnb_property_id'),
  icalUrl: text('ical_url'),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: text('last_sync_status'),
  lastSyncMessage: text('last_sync_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  airbnbBookingId: text('airbnb_booking_id'),
  guestName: text('guest_name').notNull(),
  checkIn: timestamp('check_in').notNull(),
  checkOut: timestamp('check_out').notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  cleaningStatus: cleaningStatusEnum('cleaning_status').notNull().default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cleanerJobs = pgTable('cleaner_jobs', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id),
  assignedCleanerId: integer('assigned_cleaner_id').references(() => users.id),
  assignedCompanyId: integer('assigned_company_id').references(() => users.id),
  status: jobStatusEnum('status').notNull().default('unassigned'),
  payoutAmount: decimal('payout_amount', { precision: 10, scale: 2 }).notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  checklist: jsonb('checklist'),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  jobId: integer('job_id').references(() => cleanerJobs.id),
  type: paymentTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  description: text('description'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id),
  source: text('source').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const photoTypeEnum = pgEnum('photo_type', ['before', 'after']);

export const jobPhotos = pgTable('job_photos', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => cleanerJobs.id),
  cleanerId: integer('cleaner_id').notNull().references(() => users.id),
  type: photoTypeEnum('type').notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cleaningChecklists = pgTable('cleaning_checklists', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  name: text('name').notNull(),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const checklistCompletions = pgTable('checklist_completions', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => cleanerJobs.id),
  checklistId: integer('checklist_id').notNull().references(() => cleaningChecklists.id),
  completedItems: jsonb('completed_items').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
});

export const cleanerAvailability = pgTable('cleaner_availability', {
  id: serial('id').primaryKey(),
  cleanerId: integer('cleaner_id').notNull().references(() => users.id),
  weekday: integer('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cleanerTimeOff = pgTable('cleaner_time_off', {
  id: serial('id').primaryKey(),
  cleanerId: integer('cleaner_id').notNull().references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertCleanerJobSchema = createInsertSchema(cleanerJobs).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  timestamp: true,
});

export const insertJobPhotoSchema = createInsertSchema(jobPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertCleaningChecklistSchema = createInsertSchema(cleaningChecklists).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertCleanerAvailabilitySchema = createInsertSchema(cleanerAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertCleanerTimeOffSchema = createInsertSchema(cleanerTimeOff).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type CleanerJob = typeof cleanerJobs.$inferSelect;
export type InsertCleanerJob = z.infer<typeof insertCleanerJobSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;

export type JobPhoto = typeof jobPhotos.$inferSelect;
export type InsertJobPhoto = z.infer<typeof insertJobPhotoSchema>;

export type CleaningChecklist = typeof cleaningChecklists.$inferSelect;
export type InsertCleaningChecklist = z.infer<typeof insertCleaningChecklistSchema>;

export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistCompletion = z.infer<typeof insertChecklistCompletionSchema>;

export type CleanerAvailability = typeof cleanerAvailability.$inferSelect;
export type InsertCleanerAvailability = z.infer<typeof insertCleanerAvailabilitySchema>;

export type CleanerTimeOff = typeof cleanerTimeOff.$inferSelect;
export type InsertCleanerTimeOff = z.infer<typeof insertCleanerTimeOffSchema>;
