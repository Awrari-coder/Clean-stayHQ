import { db } from "../db";
import { bookings, cleanerJobs, users, syncLogs } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { storage } from "../storage";
import { notifyNewJobAssigned } from "./notificationsService";

// Check if a cleaner is available on a specific date/time
async function isCleanerAvailable(cleanerId: number, scheduledDate: Date): Promise<boolean> {
  const weekday = scheduledDate.getDay();
  const timeString = scheduledDate.toTimeString().substring(0, 5); // HH:MM
  
  // Get cleaner's availability for this weekday
  const availability = await storage.getCleanerAvailability(cleanerId);
  const dayAvailability = availability.find(a => a.weekday === weekday);
  
  // If no availability set for this day, assume available (default behavior)
  if (!dayAvailability) {
    return true;
  }
  
  // Check if the scheduled time falls within availability window
  const startTime = dayAvailability.startTime;
  const endTime = dayAvailability.endTime;
  
  if (timeString < startTime || timeString > endTime) {
    return false;
  }
  
  // Check for time off conflicts
  const timeOff = await storage.getCleanerTimeOff(cleanerId);
  const scheduledDateStr = scheduledDate.toISOString().split('T')[0];
  
  for (const off of timeOff) {
    if (scheduledDateStr >= off.startDate && scheduledDateStr <= off.endDate) {
      return false;
    }
  }
  
  return true;
}

export async function assignCleanersToBookings(): Promise<number> {
  console.log("[Scheduler] Looking for unassigned bookings...");

  // Find bookings that need cleaning jobs assigned
  const pendingBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.cleaningStatus, "pending"),
        eq(bookings.status, "confirmed")
      )
    );

  if (pendingBookings.length === 0) {
    console.log("[Scheduler] No pending bookings to assign");
    return 0;
  }

  // Get all cleaners
  const allCleaners = await db.select()
    .from(users)
    .where(eq(users.role, "cleaner"));

  if (allCleaners.length === 0) {
    console.log("[Scheduler] No cleaners available");
    return 0;
  }

  let assigned = 0;

  for (const booking of pendingBookings) {
    // Check if job already exists for this booking
    const existingJob = await db.select()
      .from(cleanerJobs)
      .where(eq(cleanerJobs.bookingId, booking.id))
      .limit(1);

    if (existingJob.length > 0) {
      continue;
    }

    const scheduledDate = booking.checkOut;
    
    // Filter cleaners by availability for this date/time
    const availableCleaners = [];
    for (const cleaner of allCleaners) {
      const isAvailable = await isCleanerAvailable(cleaner.id, scheduledDate);
      if (isAvailable) {
        availableCleaners.push(cleaner);
      }
    }

    if (availableCleaners.length === 0) {
      console.log(`[Scheduler] No cleaners available for booking ${booking.id} on ${scheduledDate.toISOString()}`);
      
      // Log warning
      await db.insert(syncLogs).values({
        source: "scheduler",
        status: "warning",
        message: `No available cleaners for booking ${booking.id} scheduled on ${scheduledDate.toLocaleDateString()}`,
      });
      
      continue;
    }

    // Simple round-robin assignment from available cleaners
    const cleanerIndex = assigned % availableCleaners.length;
    const cleaner = availableCleaners[cleanerIndex];

    // Create cleaner job
    const [newJob] = await db.insert(cleanerJobs).values({
      bookingId: booking.id,
      assignedCleanerId: cleaner.id,
      status: "assigned",
      payoutAmount: "85.00",
      scheduledDate: booking.checkOut,
    }).returning();

    // Update booking cleaning status
    await db.update(bookings)
      .set({ cleaningStatus: "scheduled" })
      .where(eq(bookings.id, booking.id));

    // Send notification to cleaner
    notifyNewJobAssigned(newJob.id).catch(err => console.error("[Scheduler] Notification error:", err));

    assigned++;
    console.log(`[Scheduler] Assigned booking ${booking.id} to cleaner ${cleaner.name}`);
  }

  console.log(`[Scheduler] Assigned ${assigned} bookings to cleaners`);
  return assigned;
}

export function startScheduler() {
  console.log("[Scheduler] Starting automatic job scheduler...");
  
  // Run immediately on startup
  assignCleanersToBookings().catch(console.error);
  
  // Then run every 5 minutes
  setInterval(() => {
    assignCleanersToBookings().catch(console.error);
  }, 5 * 60 * 1000);
}
