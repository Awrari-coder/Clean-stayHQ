import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, Navigation, DollarSign } from "lucide-react";
import { MOCK_TASKS } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CleanerDashboard() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "completed" as const } : t));
    toast({
      title: "Task Completed",
      description: "Payment has been processed to your wallet.",
      variant: "default",
    });
  };

  const pendingTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <DashboardLayout role="cleaner">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
            <p className="text-muted-foreground mt-1">Ready to shine? You have {pendingTasks.length} upcoming jobs.</p>
          </div>
          <div className="bg-card px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
             <div className="bg-green-100 text-green-700 p-2 rounded-full">
               <DollarSign className="h-5 w-5" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wallet Balance</p>
               <p className="text-xl font-bold">$420.50</p>
             </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming Jobs</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                         <Badge variant="secondary" className="mb-2">
                           Cleaning
                         </Badge>
                         <h3 className="text-xl font-heading font-semibold text-foreground">{task.property}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">${task.payout}</span>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{task.date} • 10:00 AM - 2:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Austin, TX (Code: 4829)</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button className="flex-1 sm:flex-none" onClick={() => handleCompleteTask(task.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-none">
                        <Navigation className="mr-2 h-4 w-4" /> Get Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No upcoming tasks scheduled for now.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-4">
              {completedTasks.map((task) => (
                <Card key={task.id} className="flex items-center justify-between p-4 opacity-75 hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-4">
                     <div className="bg-green-100 text-green-700 p-2 rounded-full">
                       <CheckCircle className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="font-medium">{task.property}</p>
                       <p className="text-sm text-muted-foreground">{task.date}</p>
                     </div>
                   </div>
                   <span className="font-bold text-green-700">+${task.payout}</span>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper components for Tabs to avoid import errors if not exported from UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
