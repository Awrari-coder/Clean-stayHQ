import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, MapPin, Navigation, DollarSign, Loader2, Calendar, User } from "lucide-react";
import { useCleanerJobs, useCompleteJob, useCleanerStats, useCleanerPayouts } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { CleanerAvailability } from "@/components/CleanerAvailability";
import { ActivityFeed } from "@/components/ActivityFeed";

function ScheduleSection() {
  const { data: jobs = [], isLoading } = useCleanerJobs();
  
  const upcomingJobs = jobs.filter((j: any) => j.status !== "completed")
    .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Upcoming Jobs</CardTitle>
          <CardDescription>Your scheduled cleaning appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : upcomingJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No upcoming jobs scheduled</div>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{job.property_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(job.scheduled_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">{job.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">{job.status}</Badge>
                    <p className="text-lg font-bold text-green-600 mt-1">${job.payout_amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EarningsSection() {
  const { data: payoutData, isLoading } = useCleanerPayouts();
  const { data: stats } = useCleanerStats();

  const payouts = payoutData?.payouts || [];
  const totalPending = payoutData?.totalPending || 0;
  const totalCompleted = payoutData?.totalCompleted || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats?.totalEarnings?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCompleted.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payment history yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.description}</TableCell>
                    <TableCell className="font-bold text-green-600">${p.amount}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(p.createdAt), 'MMM dd, yyyy')}</TableCell>
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

function ProfileSection() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xl font-semibold">{user?.name}</p>
              <p className="text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="grid gap-4 pt-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{user?.phone || 'Not set'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CleanerDashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: jobs = [], isLoading } = useCleanerJobs();
  const { data: stats } = useCleanerStats();
  const completeJob = useCompleteJob();

  const getSection = () => {
    if (location.startsWith('/cleaner/schedule')) return 'schedule';
    if (location.startsWith('/cleaner/payments')) return 'earnings';
    if (location.startsWith('/cleaner/availability')) return 'availability';
    if (location.startsWith('/cleaner/settings')) return 'profile';
    return 'tasks';
  };

  const section = getSection();

  const handleCompleteTask = (jobId: number) => {
    completeJob.mutate(jobId, {
      onSuccess: () => {
        toast({
          title: "Task Completed",
          description: "Payment has been processed to your wallet.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to complete task. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const pendingJobs = jobs.filter((j: any) => j.status !== "completed");
  const completedJobs = jobs.filter((j: any) => j.status === "completed");

  const renderSection = () => {
    switch (section) {
      case 'schedule':
        return <ScheduleSection />;
      case 'earnings':
        return <EarningsSection />;
      case 'availability':
        return <CleanerAvailability />;
      case 'profile':
        return <ProfileSection />;
      default:
        return (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-schedule">My Tasks</h1>
                <p className="text-muted-foreground mt-1">Ready to shine, {user?.name}? You have {pendingJobs.length} upcoming jobs.</p>
              </div>
              <div className="bg-card px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
                 <div className="bg-green-100 text-green-700 p-2 rounded-full">
                   <DollarSign className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Earnings</p>
                   <p className="text-xl font-bold" data-testid="text-earnings">${stats?.totalEarnings?.toFixed(2) ?? '0.00'}</p>
                 </div>
              </div>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming Jobs ({pendingJobs.length})</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Completed ({completedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading jobs...
              </div>
            ) : pendingJobs.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No upcoming tasks scheduled for now.</p>
              </div>
            ) : (
              pendingJobs.map((job: any) => (
                <Card key={job.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow" data-testid={`card-job-${job.id}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                           <Badge variant="secondary" className="mb-2">
                             Cleaning
                           </Badge>
                           <h3 className="text-xl font-heading font-semibold text-foreground">{job.property_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary" data-testid={`text-payout-${job.id}`}>${job.payout_amount}</span>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(job.scheduled_date), 'MMM dd, yyyy')} • 10:00 AM - 2:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{job.address}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button 
                          className="flex-1 sm:flex-none" 
                          onClick={() => handleCompleteTask(job.id)}
                          disabled={completeJob.isPending}
                          data-testid={`button-complete-${job.id}`}
                        >
                          {completeJob.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Mark Complete
                        </Button>
                        <Button variant="outline" className="flex-1 sm:flex-none" data-testid={`button-directions-${job.id}`}>
                          <Navigation className="mr-2 h-4 w-4" /> Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-4">
              {completedJobs.map((job: any) => (
                <Card key={job.id} className="flex items-center justify-between p-4 opacity-75 hover:opacity-100 transition-opacity" data-testid={`card-completed-${job.id}`}>
                   <div className="flex items-center gap-4">
                     <div className="bg-green-100 text-green-700 p-2 rounded-full">
                       <CheckCircle className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="font-medium">{job.property_name}</p>
                       <p className="text-sm text-muted-foreground">{format(new Date(job.scheduled_date), 'MMM dd, yyyy')}</p>
                     </div>
                   </div>
                   <span className="font-bold text-green-700">+${job.payout_amount}</span>
                </Card>
              ))}
              {completedJobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No completed jobs yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <ActivityFeed title="Recent Activity" />
          </>
        );
    }
  };

  return (
    <DashboardLayout role={user?.role === "cleaning_company" ? "cleaning_company" : "cleaner"}>
      <EmailVerificationBanner />
      <div className="space-y-8">
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
