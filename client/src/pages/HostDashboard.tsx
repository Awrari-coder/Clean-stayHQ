import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Home, CheckCircle, ArrowUpRight, Loader2, User, Settings, Plus, Eye } from "lucide-react";
import { useHostBookings, useHostStats, useHostSync, useHostProperties, useCreateBooking } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ConnectCalendar } from "@/components/ConnectCalendar";
import { useLocation } from "wouter";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { HostCalendarSettings } from "@/components/HostCalendarSettings";
import { HostPropertiesManager } from "@/components/HostPropertiesManager";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BookingManager } from "@/components/BookingManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function BookingsSection() {
  const { data: bookings = [], isLoading, refetch } = useHostBookings();
  const { data: properties = [] } = useHostProperties();
  const createBooking = useCreateBooking();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    guestName: "",
    checkIn: "",
    checkOut: "",
    amount: "",
    specialInstructions: "",
  });

  const handleOpenBooking = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setManagerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.guestName || !formData.checkIn || !formData.checkOut || !formData.amount) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    createBooking.mutate({
      propertyId: parseInt(formData.propertyId),
      guestName: formData.guestName,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      amount: parseFloat(formData.amount),
      specialInstructions: formData.specialInstructions || undefined,
    }, {
      onSuccess: () => {
        toast({ title: "Booking created", description: "A cleaner will be automatically assigned if available." });
        setDialogOpen(false);
        setFormData({ propertyId: "", guestName: "", checkIn: "", checkOut: "", amount: "", specialInstructions: "" });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to create booking", variant: "destructive" });
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-booking">
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Booking</DialogTitle>
              <DialogDescription>Create a manual booking for one of your properties</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select value={formData.propertyId} onValueChange={(v) => setFormData(f => ({ ...f, propertyId: v }))}>
                  <SelectTrigger data-testid="select-property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input
                  id="guestName"
                  data-testid="input-guest-name"
                  value={formData.guestName}
                  onChange={(e) => setFormData(f => ({ ...f, guestName: e.target.value }))}
                  placeholder="Guest name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check In *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    data-testid="input-check-in"
                    value={formData.checkIn}
                    onChange={(e) => setFormData(f => ({ ...f, checkIn: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check Out *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    data-testid="input-check-out"
                    value={formData.checkOut}
                    onChange={(e) => setFormData(f => ({ ...f, checkOut: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Booking Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  data-testid="input-amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Input
                  id="instructions"
                  data-testid="input-instructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData(f => ({ ...f, specialInstructions: e.target.value }))}
                  placeholder="Optional notes for cleaners"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createBooking.isPending} data-testid="button-submit-booking">
                {createBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Complete list of your property bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bookings found. Click "Add Booking" to create one.</div>
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => (
                  <TableRow 
                    key={booking.id} 
                    data-testid={`row-booking-${booking.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenBooking(booking.id)}
                  >
                    <TableCell className="font-medium">{booking.guest_name}</TableCell>
                    <TableCell>{booking.property_name}</TableCell>
                    <TableCell>{format(new Date(booking.check_in), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{booking.status}</Badge>
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
                    <TableCell>
                      <Button variant="ghost" size="sm" data-testid={`button-view-booking-${booking.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <BookingManager 
        bookingId={selectedBookingId}
        open={managerOpen}
        onOpenChange={(open) => {
          setManagerOpen(open);
          if (!open) {
            refetch();
          }
        }}
      />
    </div>
  );
}

function PaymentsSection() {
  const { data: stats } = useHostStats();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats?.totalRevenue?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBookings ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cleanings Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedCleanings ?? 0}</div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track your earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Payment details coming soon. Contact support for detailed statements.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your host profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="bg-muted p-3 rounded-full">
              <Settings className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-muted-foreground">Manage email and SMS preferences</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HostDashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useHostBookings();
  const { data: properties = [] } = useHostProperties();
  const { data: stats, refetch: refetchStats } = useHostStats();
  const syncMutation = useHostSync();

  const getSection = () => {
    if (location.startsWith('/host/properties')) return 'properties';
    if (location.startsWith('/host/bookings')) return 'bookings';
    if (location.startsWith('/host/payments')) return 'payments';
    if (location.startsWith('/host/calendar')) return 'calendar';
    if (location.startsWith('/host/settings')) return 'settings';
    return 'dashboard';
  };

  const section = getSection();

  const handleSyncComplete = () => {
    refetchBookings();
    refetchStats();
  };

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
        handleSyncComplete();
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

  const renderSection = () => {
    switch (section) {
      case 'properties':
        return <HostPropertiesManager />;
      case 'bookings':
        return <BookingsSection />;
      case 'payments':
        return <PaymentsSection />;
      case 'calendar':
        return <HostCalendarSettings />;
      case 'settings':
        return <SettingsSection />;
      default:
        return (
          <>
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

            <ConnectCalendar properties={properties} onSyncComplete={handleSyncComplete} />

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
            
            <ActivityFeed title="Recent Activity" />
          </>
        );
    }
  };

  return (
    <DashboardLayout role="host">
      <EmailVerificationBanner />
      <div className="space-y-8">
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
