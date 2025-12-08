import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Home, CheckCircle, Clock, ArrowUpRight, MessageSquare } from "lucide-react";
import { MOCK_BOOKINGS } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

export default function HostDashboard() {
  const activeBookings = MOCK_BOOKINGS.filter(b => b.status === "confirmed" || b.status === "checked-in");
  const completedCleanings = MOCK_BOOKINGS.filter(b => b.cleaningStatus === "completed").length;
  const totalRevenue = MOCK_BOOKINGS.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSync = () => {
    toast({
      title: "Syncing with Airbnb",
      description: "Fetching latest bookings and calendar updates from Texas region...",
    });
    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: "Your calendar is up to date.",
        variant: "default", // success in spirit
      });
    }, 2000);
  };

  return (
    <DashboardLayout role="host">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Host Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, Sarah. Here's what's happening in Texas today.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={handleSync}>
               <Calendar className="mr-2 h-4 w-4" /> Sync Calendar
             </Button>
             <Button className="bg-primary hover:bg-primary/90">
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
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">{activeBookings.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                2 checking in today
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cleanings Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCleanings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                100% on-time rate
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                Response time: 12m
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
                {MOCK_BOOKINGS.map((booking) => (
                  <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{booking.guestName}</TableCell>
                    <TableCell>{booking.property}</TableCell>
                    <TableCell>{booking.checkIn}</TableCell>
                    <TableCell>{booking.checkOut}</TableCell>
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
                          booking.cleaningStatus === 'completed' ? 'bg-green-500' :
                          booking.cleaningStatus === 'scheduled' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="capitalize text-sm">{booking.cleaningStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">${booking.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
