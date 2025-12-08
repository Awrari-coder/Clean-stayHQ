import { 
  users, 
  properties, 
  bookings, 
  cleanerJobs, 
  payments,
  syncLogs,
  type User, 
  type InsertUser,
  type Property,
  type InsertProperty,
  type Booking,
  type InsertBooking,
  type CleanerJob,
  type InsertCleanerJob,
  type Payment,
  type InsertPayment,
  type SyncLog,
  type InsertSyncLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Properties
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByHost(hostId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByProperty(propertyId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string, cleaningStatus?: string): Promise<Booking | undefined>;
  
  // Cleaner Jobs
  getCleanerJob(id: number): Promise<CleanerJob | undefined>;
  getJobsByCleaner(cleanerId: number): Promise<CleanerJob[]>;
  getAllJobs(): Promise<CleanerJob[]>;
  createCleanerJob(job: InsertCleanerJob): Promise<CleanerJob>;
  updateJobStatus(id: number, status: string): Promise<CleanerJob | undefined>;
  completeJob(id: number): Promise<CleanerJob | undefined>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Sync Logs
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  getRecentSyncLogs(limit?: number): Promise<SyncLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Properties
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getPropertiesByHost(hostId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.hostId, hostId));
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByProperty(propertyId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.propertyId, propertyId))
      .orderBy(desc(bookings.checkIn));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.checkIn));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string, cleaningStatus?: string): Promise<Booking | undefined> {
    const updateData: any = { status };
    if (cleaningStatus) {
      updateData.cleaningStatus = cleaningStatus;
    }
    const [booking] = await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  // Cleaner Jobs
  async getCleanerJob(id: number): Promise<CleanerJob | undefined> {
    const [job] = await db.select().from(cleanerJobs).where(eq(cleanerJobs.id, id));
    return job || undefined;
  }

  async getJobsByCleaner(cleanerId: number): Promise<CleanerJob[]> {
    return await db.select().from(cleanerJobs)
      .where(eq(cleanerJobs.assignedCleanerId, cleanerId))
      .orderBy(desc(cleanerJobs.scheduledDate));
  }

  async getAllJobs(): Promise<CleanerJob[]> {
    return await db.select().from(cleanerJobs).orderBy(desc(cleanerJobs.scheduledDate));
  }

  async createCleanerJob(insertJob: InsertCleanerJob): Promise<CleanerJob> {
    const [job] = await db.insert(cleanerJobs).values(insertJob).returning();
    return job;
  }

  async updateJobStatus(id: number, status: string): Promise<CleanerJob | undefined> {
    const [job] = await db.update(cleanerJobs)
      .set({ status: status as any })
      .where(eq(cleanerJobs.id, id))
      .returning();
    return job || undefined;
  }

  async completeJob(id: number): Promise<CleanerJob | undefined> {
    const [job] = await db.update(cleanerJobs)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(cleanerJobs.id, id))
      .returning();
    return job || undefined;
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  // Sync Logs
  async createSyncLog(insertLog: InsertSyncLog): Promise<SyncLog> {
    const [log] = await db.insert(syncLogs).values(insertLog).returning();
    return log;
  }

  async getRecentSyncLogs(limit: number = 50): Promise<SyncLog[]> {
    return await db.select().from(syncLogs)
      .orderBy(desc(syncLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
