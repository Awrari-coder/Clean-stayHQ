import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, MapPin, Navigation, DollarSign } from "lucide-react";
import { useJobs, useCompleteJob, useCleanerStats } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function CleanerDashboard() {
  const cleanerId = 2; // Mike Cleaner
  const { data: jobs = [], isLoading } = useJobs(cleanerId);
  const { data: stats } = useCleanerStats(cleanerId);
  const completeJob = useCompleteJob();

  const handleCompleteTask = (jobId: number) => {
    completeJob.mutate(jobId, {
      onSuccess: () => {
        toast({
          title: "Task Completed",
          description: "Payment has been processed to your wallet.",
        });
      },
    });
  };

  const pendingJobs = jobs.filter(j => j.status !== "completed");
  const completedJobs = jobs.filter(j => j.status === "completed");

  return (
    <DashboardLayout role="cleaner">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-schedule">My Schedule</h1>
            <p className="text-muted-foreground mt-1">Ready to shine? You have {pendingJobs.length} upcoming jobs.</p>
          </div>
          <div className="bg-card px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
             <div className="bg-green-100 text-green-700 p-2 rounded-full">
               <DollarSign className="h-5 w-5" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wallet Balance</p>
               <p className="text-xl font-bold" data-testid="text-earnings">${stats?.totalEarnings.toFixed(2) ?? '0.00'}</p>
             </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming Jobs</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">Loading jobs...</div>
            ) : pendingJobs.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No upcoming tasks scheduled for now.</p>
              </div>
            ) : (
              pendingJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow" data-testid={`card-job-${job.id}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                           <Badge variant="secondary" className="mb-2">
                             Cleaning
                           </Badge>
                           <h3 className="text-xl font-heading font-semibold text-foreground">Booking #{job.bookingId}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary" data-testid={`text-payout-${job.id}`}>${job.payoutAmount}</span>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(job.scheduledDate), 'MMM dd, yyyy')} • 10:00 AM - 2:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Austin, TX (Code: 4829)</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button 
                          className="flex-1 sm:flex-none" 
                          onClick={() => handleCompleteTask(job.id)}
                          disabled={completeJob.isPending}
                          data-testid={`button-complete-${job.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
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
              {completedJobs.map((job) => (
                <Card key={job.id} className="flex items-center justify-between p-4 opacity-75 hover:opacity-100 transition-opacity" data-testid={`card-completed-${job.id}`}>
                   <div className="flex items-center gap-4">
                     <div className="bg-green-100 text-green-700 p-2 rounded-full">
                       <CheckCircle className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="font-medium">Booking #{job.bookingId}</p>
                       <p className="text-sm text-muted-foreground">{format(new Date(job.scheduledDate), 'MMM dd, yyyy')}</p>
                     </div>
                   </div>
                   <span className="font-bold text-green-700">+${job.payoutAmount}</span>
                </Card>
              ))}
              {completedJobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No completed jobs yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
