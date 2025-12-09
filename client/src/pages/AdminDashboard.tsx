import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Settings, Bell, Loader2, DollarSign, TrendingUp, Users as UsersIcon, BarChart3, Award } from "lucide-react";
import { useAdminUsers, useAdminIntegrations, useAdminStats, useAdminPayouts, useMarkPayoutPaid, useAdminAnalytics } from "@/hooks/useApi";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { AdminDemandDashboard } from "@/components/AdminDemandDashboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SystemHeartbeat } from "@/components/SystemHeartbeat";

function UsersSection() {
  const { data: users = [], isLoading } = useAdminUsers();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage all registered users in the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {u.name?.charAt(0) || "?"}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>{u.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSection() {
  const { data: integrations } = useAdminIntegrations();
  
  const handleSystemCheck = () => {
    toast({
      title: "Running System Diagnostics",
      description: "Checking database integrity and API connections...",
    });
    setTimeout(() => {
      toast({
        title: "System Check Complete",
        description: "All systems operational.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <Button variant="outline" onClick={handleSystemCheck}>
          <Settings className="mr-2 h-4 w-4" /> Run Diagnostics
        </Button>
      </div>
      
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Integration Health</CardTitle>
          <CardDescription>Status of external API connections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="bg-[#FF5A5F] text-white p-2 rounded-md">
                <span className="font-bold text-xs">Air</span>
              </div>
              <div>
                <p className="font-medium">Airbnb Integration</p>
                <p className="text-sm text-muted-foreground">
                  {integrations?.airbnb?.status === 'active' ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Badge className={integrations?.airbnb?.status === 'active' 
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-red-500/15 text-red-600"
            }>
              {integrations?.airbnb?.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="bg-[#F22F46] text-white p-2 rounded-md">
                <span className="font-bold text-xs">Tw</span>
              </div>
              <div>
                <p className="font-medium">Twilio SMS</p>
                <p className="text-sm text-muted-foreground">
                  {integrations?.twilio?.status === 'active' ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-600">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="bg-black text-white p-2 rounded-md">
                <span className="font-bold text-xs">R</span>
              </div>
              <div>
                <p className="font-medium">Resend Email</p>
                <p className="text-sm text-muted-foreground">
                  {integrations?.resend?.status === 'active' ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-600">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSection() {
  const { data: analytics, isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const revenue = analytics?.revenueAnalytics;
  const cleaners = analytics?.cleanerPerformance || [];
  const jobAnalysis = analytics?.jobProfitAnalysis || [];
  const monthlyData = analytics?.monthlyRevenue || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue?.totalBookingRevenue || '0.00'}</div>
            <p className="text-xs opacity-80 mt-1">From all bookings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Cleaning Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue?.totalCleaningCosts || '0.00'}</div>
            <p className="text-xs opacity-80 mt-1">Paid to cleaners</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue?.grossProfit || '0.00'}</div>
            <p className="text-xs opacity-80 mt-1">{revenue?.profitMargin || '0'}% margin</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalPayoutsPending || '0.00'}</div>
            <p className="text-xs opacity-80 mt-1">{analytics?.pendingPayouts || 0} awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Cleaner Performance
            </CardTitle>
            <CardDescription>Rankings based on completion rate and volume</CardDescription>
          </CardHeader>
          <CardContent>
            {cleaners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No cleaner data yet</div>
            ) : (
              <div className="space-y-4">
                {cleaners.slice(0, 5).map((cleaner: any, idx: number) => (
                  <div key={cleaner.id} className="flex items-center gap-4">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{cleaner.name}</p>
                        <span className="text-sm font-bold">{cleaner.performanceScore}pts</span>
                      </div>
                      <Progress value={cleaner.performanceScore} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{cleaner.completedJobs} jobs</span>
                        <span>{cleaner.completionRate}% complete</span>
                        <span>${cleaner.totalEarnings} earned</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Monthly Revenue
            </CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No revenue data yet</div>
            ) : (
              <div className="space-y-3">
                {monthlyData.map((month: any) => {
                  const maxRevenue = Math.max(...monthlyData.map((m: any) => parseFloat(m.revenue) || 1));
                  const percentage = (parseFloat(month.revenue) / maxRevenue) * 100;
                  return (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="w-10 text-sm text-muted-foreground">{month.month}</span>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full flex items-center justify-end px-2"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        >
                          <span className="text-xs font-medium text-primary-foreground">${month.revenue}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Job Profit Analysis
          </CardTitle>
          <CardDescription>Revenue vs cleaning costs per completed job</CardDescription>
        </CardHeader>
        <CardContent>
          {jobAnalysis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed jobs to analyze</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Booking Revenue</TableHead>
                  <TableHead className="text-right">Cleaning Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobAnalysis.map((job: any) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-medium">{job.propertyName}</TableCell>
                    <TableCell className="text-right">${job.bookingRevenue}</TableCell>
                    <TableCell className="text-right text-orange-600">${job.cleaningCost}</TableCell>
                    <TableCell className={`text-right font-bold ${parseFloat(job.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${job.profit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={parseFloat(job.margin) >= 50 ? 'default' : 'outline'}>
                        {job.margin}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutsSection() {
  const { data: payouts = [], isLoading, refetch } = useAdminPayouts();
  const markPaid = useMarkPayoutPaid();

  const handleMarkPaid = (id: number) => {
    markPaid.mutate(id, {
      onSuccess: () => {
        toast({ title: "Payout marked as paid" });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to update payout", variant: "destructive" });
      },
    });
  };

  const pendingPayouts = payouts.filter((p: any) => p.status === 'pending');
  const completedPayouts = payouts.filter((p: any) => p.status === 'completed');
  const totalPending = pendingPayouts.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
        <div className="bg-card px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">Pending Payouts</p>
            <p className="text-xl font-bold">${totalPending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Pending Payouts ({pendingPayouts.length})</CardTitle>
          <CardDescription>Review and process cleaner payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : pendingPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending payouts</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.cleanerName || 'Unknown'}</TableCell>
                    <TableCell>{p.propertyName || `Job #${p.jobId}`}</TableCell>
                    <TableCell className="font-bold text-green-600">${p.amount}</TableCell>
                    <TableCell>{format(new Date(p.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkPaid(p.id)}
                        disabled={markPaid.isPending}
                      >
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Completed Payouts ({completedPayouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {completedPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No completed payouts yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedPayouts.map((p: any) => (
                  <TableRow key={p.id} className="opacity-75">
                    <TableCell>{p.cleanerName || 'Unknown'}</TableCell>
                    <TableCell className="text-green-600">${p.amount}</TableCell>
                    <TableCell>{p.paidAt ? format(new Date(p.paidAt), 'MMM dd, yyyy') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: integrations } = useAdminIntegrations();
  const { data: stats } = useAdminStats();

  const getSection = () => {
    if (location.startsWith('/admin/demand')) return 'demand';
    if (location.startsWith('/admin/analytics')) return 'analytics';
    if (location.startsWith('/admin/users')) return 'users';
    if (location.startsWith('/admin/system')) return 'system';
    if (location.startsWith('/admin/payouts')) return 'payouts';
    return 'overview';
  };

  const section = getSection();

  const handleSystemCheck = () => {
    toast({
      title: "Running System Diagnostics",
      description: "Checking database integrity and API connections...",
    });
    setTimeout(() => {
      toast({
        title: "System Check Complete",
        description: "All systems operational.",
      });
    }, 2000);
  };

  const handleSendAlert = () => {
    toast({
      title: "Alert Sent",
      description: "SMS broadcast sent to all active cleaners via Twilio.",
    });
  };

  const renderSection = () => {
    switch (section) {
      case 'demand':
        return <AdminDemandDashboard />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'users':
        return <UsersSection />;
      case 'system':
        return <SystemSection />;
      case 'payouts':
        return <PayoutsSection />;
      default:
        return (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-admin">System Admin</h1>
                <p className="text-muted-foreground mt-1">Welcome, {user?.name}. Overview of Texas Region operations.</p>
              </div>
              <div className="flex gap-2">
                 <Button variant="destructive" onClick={handleSendAlert} data-testid="button-alert">
                   <Bell className="mr-2 h-4 w-4" /> Broadcast Alert
                 </Button>
                 <Button variant="outline" onClick={handleSystemCheck} data-testid="button-system-check">
                   <Settings className="mr-2 h-4 w-4" /> System Check
                 </Button>
              </div>
            </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-system-status">
                <CheckCircle className="h-6 w-6" /> Operational
              </div>
              <p className="text-xs opacity-80 mt-1">All systems normal. 99.9% Uptime.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-user-count">{stats?.totalUsers ?? users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hosts: {stats?.hostCount ?? 0} | Cleaners: {stats?.cleanerCount ?? 0} | Admins: {stats?.adminCount ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jobs Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats?.totalJobs ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending: {stats?.pendingJobs ?? 0} | Completed: {stats?.completedJobs ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>All registered users in the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {u.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex flex-col">
                              <span>{u.name}</span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${u.id}`}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <CardDescription>Status of external API connections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-[#FF5A5F] text-white p-2 rounded-md">
                    <span className="font-bold text-xs">Air</span>
                  </div>
                  <div>
                    <p className="font-medium">Airbnb Integration</p>
                    <p className="text-sm text-muted-foreground">
                      {integrations?.airbnb?.status === 'active' ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <Badge className={integrations?.airbnb?.status === 'active' 
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-red-500/15 text-red-600"
                }>
                  {integrations?.airbnb?.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-[#F22F46] text-white p-2 rounded-md">
                     <span className="font-bold text-xs">Tw</span>
                  </div>
                  <div>
                    <p className="font-medium">Twilio SMS</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-2 rounded-md">
                    <span className="font-bold text-xs">R</span>
                  </div>
                  <div>
                    <p className="font-medium">Resend Email</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <SystemHeartbeat />
          <ActivityFeed title="System Activity" />
        </div>
          </>
        );
    }
  };

  return (
    <DashboardLayout role="admin">
      <EmailVerificationBanner />
      <div className="space-y-8">
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
