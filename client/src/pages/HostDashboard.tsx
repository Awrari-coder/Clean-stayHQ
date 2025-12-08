import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Home, CheckCircle, ArrowUpRight, MessageSquare, Loader2 } from "lucide-react";
import { useHostBookings, useHostStats, useHostSync } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function HostDashboard() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading: bookingsLoading } = useHostBookings();
  const { data: stats } = useHostStats();
  const syncMutation = useHostSync();

  const handleSync = () => {
    toast({
      title: "Syncing with Airbnb",
      description: "Fetching latest bookings and calendar updates from Texas region...",
    });
    
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Sync Complete",
          description: "Your calendar is up to date.",
        });
      },
      onError: () => {
        toast({
          title: "Sync Failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <DashboardLayout role="host">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-dashboard">Host Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's what's happening in Texas today.</p>
          </div>
          <div className="flex gap-2">
             <Button 
               variant="outline" 
               onClick={handleSync} 
               disabled={syncMutation.isPending}
               data-testid="button-sync"
             >
               {syncMutation.isPending ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               ) : (
                 <Calendar className="mr-2 h-4 w-4" />
               )}
               Sync Calendar
             </Button>
             <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-booking">
               <Home className="mr-2 h-4 w-4" /> New Booking
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-revenue">
                ${stats?.totalRevenue?.toLocaleString() ?? '0'}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-600 flex items-center mr-1 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12.5%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-bookings">
                {stats?.activeBookings ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                checking in soon
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cleanings Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-cleanings">
                {stats?.completedCleanings ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                100% on-time rate
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProperties ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active listings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>
              Manage your upcoming guests and cleaning schedules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found. Connect your Airbnb account to sync bookings.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cleaning</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" data-testid={`row-booking-${booking.id}`}>
                      <TableCell className="font-medium">{booking.guest_name}</TableCell>
                      <TableCell>{booking.property_name}</TableCell>
                      <TableCell>{format(new Date(booking.check_in), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          booking.status === 'confirmed' ? 'border-primary text-primary bg-primary/5' :
                          booking.status === 'checked-in' ? 'border-green-600 text-green-600 bg-green-50' :
                          'text-muted-foreground'
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            booking.cleaning_status === 'completed' ? 'bg-green-500' :
                            booking.cleaning_status === 'scheduled' ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`} />
                          <span className="capitalize text-sm">{booking.cleaning_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">${booking.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
