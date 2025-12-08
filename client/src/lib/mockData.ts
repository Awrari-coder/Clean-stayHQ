import { addDays, format, subDays } from "date-fns";

export type UserRole = "host" | "cleaner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Booking {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "completed" | "cancelled" | "checked-in";
  cleanerId?: string;
  cleaningStatus: "pending" | "scheduled" | "in-progress" | "completed" | "verified";
  amount: number;
}

export interface Task {
  id: string;
  bookingId: string;
  cleanerId: string;
  date: string;
  status: "pending" | "in-progress" | "completed";
  property: string;
  payout: number;
}

export const MOCK_USERS: User[] = [
  { id: "1", name: "Sarah Host", email: "sarah@example.com", role: "host", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { id: "2", name: "Mike Cleaner", email: "mike@example.com", role: "cleaner", avatar: "https://i.pravatar.cc/150?u=mike" },
  { id: "3", name: "Admin Alice", email: "admin@example.com", role: "admin", avatar: "https://i.pravatar.cc/150?u=alice" },
  { id: "4", name: "Jessica Cleaner", email: "jess@example.com", role: "cleaner", avatar: "https://i.pravatar.cc/150?u=jess" },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "BK-1001",
    guestName: "John Doe",
    property: "Downtown Loft, Austin",
    checkIn: format(subDays(new Date(), 2), "yyyy-MM-dd"),
    checkOut: format(new Date(), "yyyy-MM-dd"),
    status: "checked-in",
    cleanerId: "2",
    cleaningStatus: "scheduled",
    amount: 450,
  },
  {
    id: "BK-1002",
    guestName: "Emily Smith",
    property: "Riverside Condo, Austin",
    checkIn: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    checkOut: format(addDays(new Date(), 4), "yyyy-MM-dd"),
    status: "confirmed",
    cleanerId: "4",
    cleaningStatus: "pending",
    amount: 620,
  },
  {
    id: "BK-1003",
    guestName: "Michael Brown",
    property: "Hill Country Cabin, Dripping Springs",
    checkIn: format(addDays(new Date(), 5), "yyyy-MM-dd"),
    checkOut: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    status: "confirmed",
    cleanerId: "2",
    cleaningStatus: "scheduled",
    amount: 850,
  },
  {
    id: "BK-1004",
    guestName: "Sarah Wilson",
    property: "Downtown Loft, Austin",
    checkIn: format(subDays(new Date(), 10), "yyyy-MM-dd"),
    checkOut: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    status: "completed",
    cleanerId: "2",
    cleaningStatus: "completed",
    amount: 500,
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "TSK-001",
    bookingId: "BK-1001",
    cleanerId: "2",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "pending",
    property: "Downtown Loft, Austin",
    payout: 85,
  },
  {
    id: "TSK-002",
    bookingId: "BK-1003",
    cleanerId: "2",
    date: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    status: "pending",
    property: "Hill Country Cabin, Dripping Springs",
    payout: 120,
  },
];

export const REGION = "Texas, USA";
