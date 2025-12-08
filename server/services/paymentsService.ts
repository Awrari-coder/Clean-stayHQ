// Payments Service - Manages payouts for completed cleaning jobs
import { db } from "../db";
import { payments, cleanerJobs, users, bookings, properties } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface PayoutSummary {
  totalPending: number;
  totalCompleted: number;
  totalAllTime: number;
  payouts: PayoutDetails[];
}

export interface PayoutDetails {
  id: number;
  jobId: number | null;
  amount: string;
  status: string;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
  propertyName?: string;
  cleanerName?: string;
  cleanerEmail?: string;
}

// Create a payout record for a completed job
export async function createPayoutForJob(jobId: number, cleanerId: number): Promise<void> {
  try {
    const [job] = await db.select().from(cleanerJobs).where(eq(cleanerJobs.id, jobId));
    
    if (!job) {
      console.log(`[Payments] Job ${jobId} not found`);
      return;
    }

    const payoutAmount = job.payoutAmount || "0.00";

    // Create payout with pending status
    await db.insert(payments).values({
      userId: cleanerId,
      jobId: jobId,
      type: "payout",
      amount: payoutAmount,
      status: "pending",
      description: `Payout for job #${jobId}`,
    });

    console.log(`[Payments] Created pending payout of $${payoutAmount} for cleaner ${cleanerId}`);
  } catch (error) {
    console.error("[Payments] Failed to create payout:", error);
    throw error;
  }
}

// Mark a payout as paid
export async function markPayoutPaid(paymentId: number): Promise<boolean> {
  try {
    const [updated] = await db.update(payments)
      .set({
        status: "completed",
        paidAt: new Date()
      })
      .where(and(
        eq(payments.id, paymentId),
        eq(payments.type, "payout")
      ))
      .returning();

    if (updated) {
      console.log(`[Payments] Marked payment ${paymentId} as paid`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Payments] Failed to mark payout paid:", error);
    return false;
  }
}

// Get payout summary for a cleaner
export async function getCleanerPayoutSummary(cleanerId: number): Promise<PayoutSummary> {
  const allPayouts = await db.select({
    id: payments.id,
    jobId: payments.jobId,
    amount: payments.amount,
    status: payments.status,
    description: payments.description,
    paidAt: payments.paidAt,
    createdAt: payments.createdAt,
  })
  .from(payments)
  .where(and(
    eq(payments.userId, cleanerId),
    eq(payments.type, "payout")
  ))
  .orderBy(desc(payments.createdAt));

  const totalPending = allPayouts
    .filter(p => p.status === "pending")
    .reduce((acc, p) => acc + parseFloat(p.amount), 0);

  const totalCompleted = allPayouts
    .filter(p => p.status === "completed")
    .reduce((acc, p) => acc + parseFloat(p.amount), 0);

  return {
    totalPending,
    totalCompleted,
    totalAllTime: totalPending + totalCompleted,
    payouts: allPayouts
  };
}

// Get all payouts with details for admin
export async function getAllPayoutsWithDetails(): Promise<PayoutDetails[]> {
  const allPayouts = await db.select({
    id: payments.id,
    jobId: payments.jobId,
    amount: payments.amount,
    status: payments.status,
    description: payments.description,
    paidAt: payments.paidAt,
    createdAt: payments.createdAt,
    cleanerName: users.name,
    cleanerEmail: users.email,
  })
  .from(payments)
  .leftJoin(users, eq(payments.userId, users.id))
  .where(eq(payments.type, "payout"))
  .orderBy(desc(payments.createdAt));

  // Enrich with property names
  const enrichedPayouts = await Promise.all(allPayouts.map(async (payout) => {
    let propertyName = undefined;
    
    if (payout.jobId) {
      const [job] = await db.select().from(cleanerJobs).where(eq(cleanerJobs.id, payout.jobId));
      if (job) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, job.bookingId));
        if (booking) {
          const [property] = await db.select().from(properties).where(eq(properties.id, booking.propertyId));
          propertyName = property?.name;
        }
      }
    }

    return {
      ...payout,
      propertyName
    };
  }));

  return enrichedPayouts;
}
