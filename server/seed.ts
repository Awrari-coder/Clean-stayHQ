import { db } from "./db";
import { users, properties, bookings, cleanerJobs, payments } from "@shared/schema";
import { addDays, subDays } from "date-fns";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(payments);
  await db.delete(cleanerJobs);
  await db.delete(bookings);
  await db.delete(properties);
  await db.delete(users);

  // Create users (password: "password" - in production, hash this!)
  const [host, cleaner1, cleaner2, admin] = await db.insert(users).values([
    {
      name: "Sarah Host",
      email: "sarah@example.com",
      passwordHash: "$2a$10$YqhXZ8Z8Z8Z8Z8Z8Z8Z8ZeXZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8", // "password"
      role: "host",
      phone: "+1-512-555-0101",
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Mike Cleaner",
      email: "mike@example.com",
      passwordHash: "$2a$10$YqhXZ8Z8Z8Z8Z8Z8Z8Z8ZeXZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8",
      role: "cleaner",
      phone: "+1-512-555-0102",
      avatar: "https://i.pravatar.cc/150?u=mike",
    },
    {
      name: "Jessica Cleaner",
      email: "jess@example.com",
      passwordHash: "$2a$10$YqhXZ8Z8Z8Z8Z8Z8Z8Z8ZeXZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8",
      role: "cleaner",
      phone: "+1-512-555-0103",
      avatar: "https://i.pravatar.cc/150?u=jess",
    },
    {
      name: "Admin Alice",
      email: "admin@example.com",
      passwordHash: "$2a$10$YqhXZ8Z8Z8Z8Z8Z8Z8Z8ZeXZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8",
      role: "admin",
      phone: "+1-512-555-0100",
      avatar: "https://i.pravatar.cc/150?u=alice",
    },
  ]).returning();

  console.log("✅ Created users");

  // Create properties
  const [property1, property2, property3] = await db.insert(properties).values([
    {
      hostId: host.id,
      name: "Downtown Loft",
      address: "123 Congress Ave",
      city: "Austin",
      state: "TX",
      zip: "78701",
      latitude: "30.267153",
      longitude: "-97.743057",
      airbnbPropertyId: "ABN-12345",
    },
    {
      hostId: host.id,
      name: "Riverside Condo",
      address: "456 S 1st St",
      city: "Austin",
      state: "TX",
      zip: "78704",
      latitude: "30.251904",
      longitude: "-97.751083",
      airbnbPropertyId: "ABN-12346",
    },
    {
      hostId: host.id,
      name: "Hill Country Cabin",
      address: "789 Ranch Rd",
      city: "Dripping Springs",
      state: "TX",
      zip: "78620",
      latitude: "30.189941",
      longitude: "-98.086815",
      airbnbPropertyId: "ABN-12347",
    },
  ]).returning();

  console.log("✅ Created properties");

  // Create bookings
  const [booking1, booking2, booking3, booking4] = await db.insert(bookings).values([
    {
      propertyId: property1.id,
      airbnbBookingId: "BK-1001",
      guestName: "John Doe",
      checkIn: subDays(new Date(), 2),
      checkOut: new Date(),
      status: "checked-in",
      cleaningStatus: "scheduled",
      amount: "450.00",
    },
    {
      propertyId: property2.id,
      airbnbBookingId: "BK-1002",
      guestName: "Emily Smith",
      checkIn: addDays(new Date(), 1),
      checkOut: addDays(new Date(), 4),
      status: "confirmed",
      cleaningStatus: "pending",
      amount: "620.00",
    },
    {
      propertyId: property3.id,
      airbnbBookingId: "BK-1003",
      guestName: "Michael Brown",
      checkIn: addDays(new Date(), 5),
      checkOut: addDays(new Date(), 8),
      status: "confirmed",
      cleaningStatus: "scheduled",
      amount: "850.00",
    },
    {
      propertyId: property1.id,
      airbnbBookingId: "BK-1004",
      guestName: "Sarah Wilson",
      checkIn: subDays(new Date(), 10),
      checkOut: subDays(new Date(), 7),
      status: "completed",
      cleaningStatus: "completed",
      amount: "500.00",
    },
  ]).returning();

  console.log("✅ Created bookings");

  // Create cleaner jobs
  const [job1, job2, job3] = await db.insert(cleanerJobs).values([
    {
      bookingId: booking1.id,
      assignedCleanerId: cleaner1.id,
      status: "assigned",
      payoutAmount: "85.00",
      scheduledDate: new Date(),
    },
    {
      bookingId: booking3.id,
      assignedCleanerId: cleaner1.id,
      status: "assigned",
      payoutAmount: "120.00",
      scheduledDate: addDays(new Date(), 8),
    },
    {
      bookingId: booking4.id,
      assignedCleanerId: cleaner1.id,
      status: "completed",
      payoutAmount: "95.00",
      scheduledDate: subDays(new Date(), 7),
      completedAt: subDays(new Date(), 7),
    },
  ]).returning();

  console.log("✅ Created cleaner jobs");

  // Create payments
  await db.insert(payments).values([
    {
      userId: cleaner1.id,
      jobId: job3.id,
      type: "payout",
      amount: "95.00",
      status: "completed",
      description: "Completed cleaning at Downtown Loft",
    },
    {
      userId: host.id,
      type: "deposit",
      amount: "500.00",
      status: "completed",
      description: "Booking payment from Sarah Wilson",
    },
  ]);

  console.log("✅ Created payments");
  console.log("🎉 Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
