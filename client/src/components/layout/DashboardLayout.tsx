import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Brush,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole, MOCK_USERS } from "@/lib/mockData";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const Sidebar = ({ role, collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) => {
  const [location] = useLocation();

  const links = {
    host: [
      { href: "/host", label: "Dashboard", icon: LayoutDashboard },
      { href: "/host/bookings", label: "Bookings", icon: Calendar },
      { href: "/host/payments", label: "Payments", icon: DollarSign },
      { href: "/host/settings", label: "Settings", icon: Settings },
    ],
    cleaner: [
      { href: "/cleaner", label: "My Tasks", icon: Brush },
      { href: "/cleaner/schedule", label: "Schedule", icon: Calendar },
      { href: "/cleaner/payments", label: "Earnings", icon: DollarSign },
      { href: "/cleaner/settings", label: "Profile", icon: Settings },
    ],
    admin: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/system", label: "System", icon: Settings },
    ]
  };

  const currentLinks = links[role] || [];
  const user = MOCK_USERS.find(u => u.role === role);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border flex flex-col",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
              <span className="font-heading font-bold text-white text-lg">C</span>
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-xl tracking-tight">CleanStay</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            
            return (
              <Link key={link.href} href={link.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white")} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{link.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {link.label}
                    </div>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export const DashboardLayout = ({ children, role }: { children: React.ReactNode, role: UserRole }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        role={role} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          collapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <header className="h-16 bg-background/80 backdrop-blur-sm border-b sticky top-0 z-30 px-6 flex items-center justify-between md:justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              Region: <span className="font-medium text-foreground">Texas, USA (CST)</span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? "Expand" : "Collapse"}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};
