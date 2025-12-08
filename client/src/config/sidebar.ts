import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Brush,
  DollarSign,
  Cog,
  BarChart3
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export type UserRole = "host" | "cleaner" | "admin" | "cleaning_company";

export const SIDEBAR_CONFIG: Record<UserRole, SidebarLink[]> = {
  host: [
    { label: "Dashboard", href: "/host", icon: LayoutDashboard },
    { label: "Bookings", href: "/host/bookings", icon: Calendar },
    { label: "Payments", href: "/host/payments", icon: DollarSign },
    { label: "Settings", href: "/host/settings", icon: Settings },
  ],

  cleaner: [
    { label: "My Tasks", href: "/cleaner", icon: Brush },
    { label: "Schedule", href: "/cleaner/schedule", icon: Calendar },
    { label: "Earnings", href: "/cleaner/payments", icon: DollarSign },
    { label: "Profile", href: "/cleaner/settings", icon: Settings },
  ],

  cleaning_company: [
    { label: "My Tasks", href: "/cleaner", icon: Brush },
    { label: "Schedule", href: "/cleaner/schedule", icon: Calendar },
    { label: "Earnings", href: "/cleaner/payments", icon: DollarSign },
    { label: "Profile", href: "/cleaner/settings", icon: Settings },
  ],

  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Payouts", href: "/admin/payouts", icon: DollarSign },
    { label: "System", href: "/admin/system", icon: Cog },
  ],
};

export const ROLE_HOME: Record<UserRole, string> = {
  host: "/host",
  cleaner: "/cleaner",
  cleaning_company: "/cleaner",
  admin: "/admin",
};
