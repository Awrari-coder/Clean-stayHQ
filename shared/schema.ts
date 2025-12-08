import { pgTable, text, integer, serial, timestamp, decimal, jsonb, pgEnum } from "drizzle-orm/pg-core";
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
  source: text('source').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
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
