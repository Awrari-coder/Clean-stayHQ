import axios from "axios";
import ical from "node-ical";
import { db } from "../db";
import { bookings, properties, syncLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Property } from "@shared/schema";

export async function syncPropertyCalendar(property: Property): Promise<boolean> {
  try {
    if (!property.icalUrl) {
      console.log(`[iCal] Property ${property.id} has no iCal URL`);
      return false;
    }

    console.log(`[iCal] Syncing property ${property.id}: ${property.name}`);
    
    const { data } = await axios.get(property.icalUrl, { timeout: 10000 });
    const events = ical.parseICS(data);

    let syncedCount = 0;

    for (const key in events) {
      const ev = events[key];
      if (ev.type !== "VEVENT") continue;

      const checkIn = new Date(ev.start as Date);
      const checkOut = new Date(ev.end as Date);
      const guestName = (ev.summary as string) || "Reserved";

      // Check if booking already exists
      const existingBooking = await db.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.propertyId, property.id),
            eq(bookings.checkIn, checkIn),
            eq(bookings.checkOut, checkOut)
          )
        )
        .limit(1);

      if (existingBooking.length === 0) {
        // Create new booking
        await db.insert(bookings).values({
          propertyId: property.id,
          airbnbBookingId: (ev.uid as string) || null,
          guestName,
          checkIn,
          checkOut,
          status: "confirmed",
          cleaningStatus: "pending",
          amount: "0.00",
        });
        syncedCount++;
      }
    }

    // Log the sync
    await db.insert(syncLogs).values({
      source: "airbnb_ical",
      status: "success",
      message: `Synced ${syncedCount} new bookings for property ${property.id}`,
    });

    console.log(`[iCal] Synced ${syncedCount} new bookings for property ${property.id}`);
    return true;
  } catch (error) {
    console.error(`[iCal] Error syncing property ${property.id}:`, error);
    
    // Log the error
    await db.insert(syncLogs).values({
      source: "airbnb_ical",
      status: "error",
      message: `Failed to sync property ${property.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return false;
  }
}

export async function syncAllPropertiesWithIcal(): Promise<{ synced: number; failed: number }> {
  const allProperties = await db.select()
    .from(properties)
    .where(eq(properties.icalUrl, properties.icalUrl)); // Only properties with icalUrl

  let synced = 0;
  let failed = 0;

  for (const property of allProperties) {
    if (!property.icalUrl) continue;
    
    const success = await syncPropertyCalendar(property);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

export async function syncHostProperties(hostId: number): Promise<{ synced: number; failed: number }> {
  const hostProperties = await db.select()
    .from(properties)
    .where(eq(properties.hostId, hostId));

  let synced = 0;
  let failed = 0;

  for (const property of hostProperties) {
    if (!property.icalUrl) continue;
    
    const success = await syncPropertyCalendar(property);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}
