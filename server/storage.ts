import { 
  users, 
  properties, 
  bookings, 
  cleanerJobs, 
  payments,
  syncLogs,
  jobPhotos,
  cleaningChecklists,
  checklistCompletions,
  cleanerAvailability,
  cleanerTimeOff,
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
  type JobPhoto,
  type InsertJobPhoto,
  type CleaningChecklist,
  type InsertCleaningChecklist,
  type ChecklistCompletion,
  type InsertChecklistCompletion,
  type CleanerAvailability,
  type InsertCleanerAvailability,
  type CleanerTimeOff,
  type InsertCleanerTimeOff,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserVerification(userId: number, data: { emailVerified?: boolean; emailVerificationToken?: string | null; emailVerificationSentAt?: Date | null }): Promise<User | undefined>;
  
  // Properties
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByHost(hostId: number): Promise<Property[]>;
  getAllProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  hasBookingsForProperty(propertyId: number): Promise<boolean>;
  updatePropertyIcalUrl(id: number, icalUrl: string): Promise<Property | undefined>;
  updatePropertySyncStatus(id: number, status: string, message: string): Promise<Property | undefined>;
  getSyncLogsByPropertyIds(propertyIds: number[], limit?: number): Promise<SyncLog[]>;
  
  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByProperty(propertyId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsForHost(hostId: number): Promise<(Booking & { propertyName?: string })[]>;
  getAllBookingsWithDetails(): Promise<any[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string, cleaningStatus?: string): Promise<Booking | undefined>;
  
  // Cleaner Jobs
  getCleanerJob(id: number): Promise<CleanerJob | undefined>;
  getJobByBookingId(bookingId: number): Promise<CleanerJob | undefined>;
  getJobsByCleaner(cleanerId: number): Promise<(CleanerJob & { propertyName?: string; address?: string })[]>;
  getJobsByCompany(companyId: number): Promise<(CleanerJob & { propertyName?: string; address?: string })[]>;
  getAllJobs(): Promise<CleanerJob[]>;
  getAllJobsWithDetails(): Promise<any[]>;
  createCleanerJob(job: InsertCleanerJob): Promise<CleanerJob>;
  updateJobStatus(id: number, status: string): Promise<CleanerJob | undefined>;
  updateJobAssignment(id: number, cleanerId: number): Promise<CleanerJob | undefined>;
  completeJob(id: number): Promise<CleanerJob | undefined>;
  completeJobWithNotes(id: number, notes?: string): Promise<CleanerJob | undefined>;
  getDemandWithDetails(from: Date, to: Date): Promise<any[]>;
  getAllCleaners(): Promise<User[]>;
  getCleanerJobsForDate(cleanerId: number, date: Date): Promise<CleanerJob[]>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Sync Logs
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  getRecentSyncLogs(limit?: number): Promise<SyncLog[]>;
  
  // Stats
  getHostStats(hostId: number): Promise<{
    totalRevenue: number;
    activeBookings: number;
    completedCleanings: number;
    totalProperties: number;
  }>;
  getCleanerStats(cleanerId: number): Promise<{
    totalEarnings: number;
    pendingJobs: number;
    completedJobs: number;
    totalJobs: number;
  }>;
  
  // Job Photos
  addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto>;
  getJobPhotos(jobId: number): Promise<JobPhoto[]>;
  
  // Checklists
  getChecklistForJob(jobId: number): Promise<CleaningChecklist | null>;
  getChecklistCompletion(jobId: number): Promise<ChecklistCompletion | null>;
  saveChecklistCompletion(data: InsertChecklistCompletion): Promise<ChecklistCompletion>;
  
  // Cleaner Availability
  getCleanerAvailability(cleanerId: number): Promise<CleanerAvailability[]>;
  setCleanerAvailability(cleanerId: number, availability: InsertCleanerAvailability[]): Promise<CleanerAvailability[]>;
  getCleanerTimeOff(cleanerId: number): Promise<CleanerTimeOff[]>;
  addCleanerTimeOff(data: InsertCleanerTimeOff): Promise<CleanerTimeOff>;
  deleteCleanerTimeOff(id: number, cleanerId: number): Promise<boolean>;
  getAllCleanersWithAvailability(): Promise<{ cleaner: User; availability: CleanerAvailability[]; timeOff: CleanerTimeOff[] }[]>;
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

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserVerification(userId: number, data: { emailVerified?: boolean; emailVerificationToken?: string | null; emailVerificationSentAt?: Date | null }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
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

  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db.update(properties)
      .set(data)
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    await db.delete(properties).where(eq(properties.id, id));
    return true;
  }

  async hasBookingsForProperty(propertyId: number): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.propertyId, propertyId));
    return (result[0]?.count || 0) > 0;
  }

  async updatePropertyIcalUrl(id: number, icalUrl: string): Promise<Property | undefined> {
    const [property] = await db.update(properties)
      .set({ icalUrl, lastSyncStatus: null, lastSyncMessage: null })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async updatePropertySyncStatus(id: number, status: string, message: string): Promise<Property | undefined> {
    const [property] = await db.update(properties)
      .set({ lastSyncAt: new Date(), lastSyncStatus: status, lastSyncMessage: message })
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async getSyncLogsByPropertyIds(propertyIds: number[], limit: number = 20): Promise<SyncLog[]> {
    if (propertyIds.length === 0) return [];
    return await db.select().from(syncLogs)
      .where(inArray(syncLogs.propertyId, propertyIds))
      .orderBy(desc(syncLogs.timestamp))
      .limit(limit);
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
  
  async getBookingsForHost(hostId: number): Promise<(Booking & { propertyName?: string })[]> {
    const hostProperties = await this.getPropertiesByHost(hostId);
    const propertyIds = hostProperties.map(p => p.id);
    
    if (propertyIds.length === 0) return [];
    
    const result = await db.select({
      id: bookings.id,
      propertyId: bookings.propertyId,
      airbnbBookingId: bookings.airbnbBookingId,
      guestName: bookings.guestName,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      status: bookings.status,
      cleaningStatus: bookings.cleaningStatus,
      amount: bookings.amount,
      specialInstructions: bookings.specialInstructions,
      createdAt: bookings.createdAt,
      propertyName: properties.name,
    })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(inArray(bookings.propertyId, propertyIds))
    .orderBy(desc(bookings.checkIn));
    
    return result;
  }
  
  async getAllBookingsWithDetails(): Promise<any[]> {
    return await db.select({
      id: bookings.id,
      propertyId: bookings.propertyId,
      airbnbBookingId: bookings.airbnbBookingId,
      guestName: bookings.guestName,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      status: bookings.status,
      cleaningStatus: bookings.cleaningStatus,
      amount: bookings.amount,
      createdAt: bookings.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      hostId: properties.hostId,
    })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .orderBy(desc(bookings.checkIn));
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

  async getJobsByCleaner(cleanerId: number): Promise<(CleanerJob & { propertyName?: string; address?: string })[]> {
    const result = await db.select({
      id: cleanerJobs.id,
      bookingId: cleanerJobs.bookingId,
      assignedCleanerId: cleanerJobs.assignedCleanerId,
      assignedCompanyId: cleanerJobs.assignedCompanyId,
      status: cleanerJobs.status,
      payoutAmount: cleanerJobs.payoutAmount,
      scheduledDate: cleanerJobs.scheduledDate,
      checklist: cleanerJobs.checklist,
      notes: cleanerJobs.notes,
      completedAt: cleanerJobs.completedAt,
      createdAt: cleanerJobs.createdAt,
      propertyName: properties.name,
      address: properties.address,
    })
    .from(cleanerJobs)
    .innerJoin(bookings, eq(cleanerJobs.bookingId, bookings.id))
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(cleanerJobs.assignedCleanerId, cleanerId))
    .orderBy(desc(cleanerJobs.scheduledDate));
    
    return result;
  }
  
  async getJobsByCompany(companyId: number): Promise<(CleanerJob & { propertyName?: string; address?: string })[]> {
    const result = await db.select({
      id: cleanerJobs.id,
      bookingId: cleanerJobs.bookingId,
      assignedCleanerId: cleanerJobs.assignedCleanerId,
      assignedCompanyId: cleanerJobs.assignedCompanyId,
      status: cleanerJobs.status,
      payoutAmount: cleanerJobs.payoutAmount,
      scheduledDate: cleanerJobs.scheduledDate,
      checklist: cleanerJobs.checklist,
      notes: cleanerJobs.notes,
      completedAt: cleanerJobs.completedAt,
      createdAt: cleanerJobs.createdAt,
      propertyName: properties.name,
      address: properties.address,
    })
    .from(cleanerJobs)
    .innerJoin(bookings, eq(cleanerJobs.bookingId, bookings.id))
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(cleanerJobs.assignedCompanyId, companyId))
    .orderBy(desc(cleanerJobs.scheduledDate));
    
    return result;
  }

  async getAllJobs(): Promise<CleanerJob[]> {
    return await db.select().from(cleanerJobs).orderBy(desc(cleanerJobs.scheduledDate));
  }
  
  async getAllJobsWithDetails(): Promise<any[]> {
    return await db.select({
      id: cleanerJobs.id,
      bookingId: cleanerJobs.bookingId,
      assignedCleanerId: cleanerJobs.assignedCleanerId,
      assignedCompanyId: cleanerJobs.assignedCompanyId,
      status: cleanerJobs.status,
      payoutAmount: cleanerJobs.payoutAmount,
      scheduledDate: cleanerJobs.scheduledDate,
      completedAt: cleanerJobs.completedAt,
      createdAt: cleanerJobs.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      guestName: bookings.guestName,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
    })
    .from(cleanerJobs)
    .innerJoin(bookings, eq(cleanerJobs.bookingId, bookings.id))
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .orderBy(desc(cleanerJobs.scheduledDate));
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

  async completeJobWithNotes(id: number, notes?: string): Promise<CleanerJob | undefined> {
    const [job] = await db.update(cleanerJobs)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        notes: notes || null
      })
      .where(eq(cleanerJobs.id, id))
      .returning();
    return job || undefined;
  }

  async getJobByBookingId(bookingId: number): Promise<CleanerJob | undefined> {
    const [job] = await db.select().from(cleanerJobs).where(eq(cleanerJobs.bookingId, bookingId));
    return job || undefined;
  }

  async updateJobAssignment(id: number, cleanerId: number): Promise<CleanerJob | undefined> {
    const [job] = await db.update(cleanerJobs)
      .set({ 
        assignedCleanerId: cleanerId,
        status: 'assigned'
      })
      .where(eq(cleanerJobs.id, id))
      .returning();
    return job || undefined;
  }

  async getDemandWithDetails(from: Date, to: Date): Promise<any[]> {
    const result = await db.select({
      bookingId: bookings.id,
      propertyId: bookings.propertyId,
      propertyName: properties.name,
      address: properties.address,
      city: properties.city,
      hostId: properties.hostId,
      guestName: bookings.guestName,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      amount: bookings.amount,
      bookingStatus: bookings.status,
      cleaningStatus: bookings.cleaningStatus,
      jobId: cleanerJobs.id,
      jobStatus: cleanerJobs.status,
      assignedCleanerId: cleanerJobs.assignedCleanerId,
    })
    .from(bookings)
    .innerJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(cleanerJobs, eq(cleanerJobs.bookingId, bookings.id))
    .where(
      and(
        sql`${bookings.checkOut} >= ${from}`,
        sql`${bookings.checkOut} <= ${to}`
      )
    )
    .orderBy(bookings.checkOut);
    
    return result;
  }

  async getAllCleaners(): Promise<User[]> {
    return await db.select().from(users)
      .where(sql`${users.role} IN ('cleaner', 'cleaning_company')`);
  }

  async getCleanerJobsForDate(cleanerId: number, date: Date): Promise<CleanerJob[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select().from(cleanerJobs)
      .where(
        and(
          eq(cleanerJobs.assignedCleanerId, cleanerId),
          sql`${cleanerJobs.scheduledDate} >= ${startOfDay}`,
          sql`${cleanerJobs.scheduledDate} <= ${endOfDay}`
        )
      );
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
  
  // Stats
  async getHostStats(hostId: number): Promise<{
    totalRevenue: number;
    activeBookings: number;
    completedCleanings: number;
    totalProperties: number;
  }> {
    const hostProperties = await this.getPropertiesByHost(hostId);
    const hostBookings = await this.getBookingsForHost(hostId);
    
    const activeBookings = hostBookings.filter(
      b => b.status === 'confirmed' || b.status === 'checked-in'
    );
    
    const completedCleanings = hostBookings.filter(
      b => b.cleaningStatus === 'completed'
    ).length;
    
    const totalRevenue = hostBookings.reduce(
      (acc, curr) => acc + parseFloat(curr.amount),
      0
    );
    
    return {
      totalRevenue,
      activeBookings: activeBookings.length,
      completedCleanings,
      totalProperties: hostProperties.length,
    };
  }
  
  async getCleanerStats(cleanerId: number): Promise<{
    totalEarnings: number;
    pendingJobs: number;
    completedJobs: number;
    totalJobs: number;
  }> {
    const jobs = await this.getJobsByCleaner(cleanerId);
    const payments = await this.getPaymentsByUser(cleanerId);
    
    const totalEarnings = payments
      .filter(p => p.type === 'payout' && p.status === 'completed')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    
    const pendingJobs = jobs.filter(j => j.status !== 'completed').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    
    return {
      totalEarnings,
      pendingJobs,
      completedJobs,
      totalJobs: jobs.length,
    };
  }
  
  // Job Photos
  async addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto> {
    const [newPhoto] = await db.insert(jobPhotos).values(photo).returning();
    return newPhoto;
  }
  
  async getJobPhotos(jobId: number): Promise<JobPhoto[]> {
    return await db.select().from(jobPhotos)
      .where(eq(jobPhotos.jobId, jobId))
      .orderBy(desc(jobPhotos.createdAt));
  }
  
  // Checklists
  async getChecklistForJob(jobId: number): Promise<CleaningChecklist | null> {
    const job = await this.getCleanerJob(jobId);
    if (!job) return null;
    
    const booking = await this.getBooking(job.bookingId);
    if (!booking) return null;
    
    const [checklist] = await db.select().from(cleaningChecklists)
      .where(eq(cleaningChecklists.propertyId, booking.propertyId))
      .limit(1);
    
    return checklist || null;
  }
  
  async getChecklistCompletion(jobId: number): Promise<ChecklistCompletion | null> {
    const [completion] = await db.select().from(checklistCompletions)
      .where(eq(checklistCompletions.jobId, jobId))
      .limit(1);
    
    return completion || null;
  }
  
  async saveChecklistCompletion(data: InsertChecklistCompletion): Promise<ChecklistCompletion> {
    const existing = await this.getChecklistCompletion(data.jobId);
    
    if (existing) {
      const [updated] = await db.update(checklistCompletions)
        .set({ completedItems: data.completedItems, completedAt: new Date() })
        .where(eq(checklistCompletions.id, existing.id))
        .returning();
      return updated;
    }
    
    const [completion] = await db.insert(checklistCompletions).values(data).returning();
    return completion;
  }
  
  // Cleaner Availability
  async getCleanerAvailability(cleanerId: number): Promise<CleanerAvailability[]> {
    return await db.select().from(cleanerAvailability)
      .where(eq(cleanerAvailability.cleanerId, cleanerId))
      .orderBy(cleanerAvailability.weekday);
  }
  
  async setCleanerAvailability(cleanerId: number, availability: InsertCleanerAvailability[]): Promise<CleanerAvailability[]> {
    await db.delete(cleanerAvailability).where(eq(cleanerAvailability.cleanerId, cleanerId));
    
    if (availability.length === 0) return [];
    
    const toInsert = availability.map(a => ({ ...a, cleanerId }));
    const inserted = await db.insert(cleanerAvailability).values(toInsert).returning();
    return inserted;
  }
  
  async getCleanerTimeOff(cleanerId: number): Promise<CleanerTimeOff[]> {
    return await db.select().from(cleanerTimeOff)
      .where(eq(cleanerTimeOff.cleanerId, cleanerId))
      .orderBy(cleanerTimeOff.startDate);
  }
  
  async addCleanerTimeOff(data: InsertCleanerTimeOff): Promise<CleanerTimeOff> {
    const [timeOff] = await db.insert(cleanerTimeOff).values(data).returning();
    return timeOff;
  }
  
  async deleteCleanerTimeOff(id: number, cleanerId: number): Promise<boolean> {
    const result = await db.delete(cleanerTimeOff)
      .where(and(eq(cleanerTimeOff.id, id), eq(cleanerTimeOff.cleanerId, cleanerId)));
    return true;
  }
  
  async getAllCleanersWithAvailability(): Promise<{ cleaner: User; availability: CleanerAvailability[]; timeOff: CleanerTimeOff[] }[]> {
    const cleaners = await db.select().from(users)
      .where(eq(users.role, 'cleaner'));
    
    const result = await Promise.all(cleaners.map(async (cleaner) => {
      const availability = await this.getCleanerAvailability(cleaner.id);
      const timeOff = await this.getCleanerTimeOff(cleaner.id);
      return { cleaner, availability, timeOff };
    }));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
