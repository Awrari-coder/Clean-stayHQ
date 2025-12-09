import { db } from "../db";
import { activityLogs, InsertActivityLog } from "@shared/schema";
import { emitToAdmin, emitToHost, emitToCleaner, emitToAll } from "../websocket";
import { desc, eq, or, inArray } from "drizzle-orm";

interface LogActivityParams {
  userId?: number;
  targetUserId?: number;
  roleScope: "admin" | "host" | "cleaner" | "all";
  type: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const insertData: InsertActivityLog = {
      userId: params.userId ?? null,
      targetUserId: params.targetUserId ?? null,
      roleScope: params.roleScope,
      type: params.type,
      message: params.message,
      metadata: params.metadata ?? null,
    };

    const [inserted] = await db.insert(activityLogs).values(insertData).returning();

    const activityData = {
      id: inserted.id,
      type: params.type,
      message: params.message,
      createdAt: inserted.createdAt,
      metadata: params.metadata,
    };

    switch (params.roleScope) {
      case "admin":
        emitToAdmin("activity:new", activityData);
        break;
      case "host":
        if (params.targetUserId) {
          emitToHost(params.targetUserId, "activity:new", activityData);
        }
        break;
      case "cleaner":
        if (params.targetUserId) {
          emitToCleaner(params.targetUserId, "activity:new", activityData);
        }
        break;
      case "all":
        emitToAll("activity:new", activityData);
        break;
    }

    console.log(`[Activity] Logged: ${params.type} - ${params.message}`);
  } catch (error) {
    console.error("[Activity] Failed to log activity:", error);
  }
}

export async function getActivityFeed(
  userRole: string,
  userId: number,
  limit: number = 30
): Promise<any[]> {
  try {
    let activities;

    if (userRole === "admin") {
      activities = await db
        .select()
        .from(activityLogs)
        .where(inArray(activityLogs.roleScope, ["admin", "all"]))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);
    } else if (userRole === "host") {
      activities = await db
        .select()
        .from(activityLogs)
        .where(
          or(
            eq(activityLogs.roleScope, "all"),
            eq(activityLogs.targetUserId, userId)
          )
        )
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);
    } else {
      activities = await db
        .select()
        .from(activityLogs)
        .where(
          or(
            eq(activityLogs.roleScope, "all"),
            eq(activityLogs.targetUserId, userId)
          )
        )
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);
    }

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
      metadata: a.metadata,
    }));
  } catch (error) {
    console.error("[Activity] Failed to get feed:", error);
    return [];
  }
}

export function emitBookingUpdated(bookingId: number, propertyId: number, hostId: number): void {
  const data = { bookingId, propertyId, hostId };
  emitToAdmin("booking:updated", data);
  emitToHost(hostId, "booking:updated", data);
}

export function emitJobCreated(jobId: number, bookingId: number, hostId: number, cleanerId?: number): void {
  const data = { jobId, bookingId };
  emitToAdmin("job:created", data);
  emitToHost(hostId, "job:created", data);
  if (cleanerId) {
    emitToCleaner(cleanerId, "job:created", data);
  }
}

export function emitJobAssigned(jobId: number, cleanerId: number, hostId: number): void {
  const data = { jobId, cleanerId };
  emitToAdmin("job:assigned", data);
  emitToHost(hostId, "job:assigned", data);
  emitToCleaner(cleanerId, "job:assigned", data);
}

export function emitJobCompleted(jobId: number, cleanerId: number, hostId: number): void {
  const data = { jobId, cleanerId };
  emitToAdmin("job:completed", data);
  emitToHost(hostId, "job:completed", data);
  emitToCleaner(cleanerId, "job:completed", data);
}

export function emitPayoutCreated(payoutId: number, cleanerId: number, amount: string): void {
  const data = { payoutId, amount };
  emitToAdmin("payout:created", data);
  emitToCleaner(cleanerId, "payout:created", data);
}

export function emitPayoutCompleted(payoutId: number, cleanerId: number): void {
  const data = { payoutId };
  emitToAdmin("payout:completed", data);
  emitToCleaner(cleanerId, "payout:completed", data);
}
