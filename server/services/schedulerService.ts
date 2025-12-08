import { db } from "../db";
import { bookings, cleanerJobs, users } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

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

  // Get available cleaners
  const cleaners = await db.select()
    .from(users)
    .where(eq(users.role, "cleaner"));

  if (cleaners.length === 0) {
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

    // Simple round-robin assignment
    const cleanerIndex = assigned % cleaners.length;
    const cleaner = cleaners[cleanerIndex];

    // Create cleaner job
    await db.insert(cleanerJobs).values({
      bookingId: booking.id,
      assignedCleanerId: cleaner.id,
      status: "assigned",
      payoutAmount: "85.00",
      scheduledDate: booking.checkOut,
    });

    // Update booking cleaning status
    await db.update(bookings)
      .set({ cleaningStatus: "scheduled" })
      .where(eq(bookings.id, booking.id));

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
