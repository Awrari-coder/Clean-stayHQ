import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, UserPlus, Loader2, AlertCircle, CheckCircle, Clock, User } from "lucide-react";
import { useAdminDemand, useJobCandidates, useAssignJob } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface DemandItem {
  bookingId: number;
  jobId: number | null;
  propertyId: number;
  propertyName: string;
  address: string;
  hostName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  bookingStatus: string;
  cleaningStatus: string;
  demandStatus: "needs_assignment" | "assigned" | "completed";
  assignedCleanerId: number | null;
  assignedCleanerName: string | null;
}

export function AdminDemandDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoWeeksLater = addDays(today, 14);
  
  const [fromDate, setFromDate] = useState(format(today, 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(twoWeeksLater, 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigningBookingId, setAssigningBookingId] = useState<number | null>(null);
  const [selectedCleanerId, setSelectedCleanerId] = useState<number | null>(null);

  const { data: demand = [], isLoading, refetch } = useAdminDemand(fromDate, toDate, statusFilter);
  const { data: candidates = [], isLoading: candidatesLoading } = useJobCandidates(assigningBookingId);
  const assignJob = useAssignJob();

  const handleAssign = async () => {
    if (!assigningBookingId || !selectedCleanerId) return;
    
    try {
      await assignJob.mutateAsync({ bookingId: assigningBookingId, cleanerId: selectedCleanerId });
      toast({
        title: "Cleaner Assigned",
        description: "The cleaner has been notified of their new job.",
      });
      setAssigningBookingId(null);
      setSelectedCleanerId(null);
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign cleaner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "needs_assignment":
        return <Badge className="bg-amber-500/15 text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />Needs Assignment</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500/15 text-blue-600"><Clock className="h-3 w-3 mr-1" />Assigned</Badge>;
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: demand.length,
    needsAssignment: demand.filter((d: DemandItem) => d.demandStatus === "needs_assignment").length,
    assigned: demand.filter((d: DemandItem) => d.demandStatus === "assigned").length,
    completed: demand.filter((d: DemandItem) => d.demandStatus === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demand Dashboard</h1>
        <p className="text-muted-foreground mt-1">View incoming bookings and assign cleaners</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Needs Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{stats.needsAssignment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Cleaning Demand</CardTitle>
              <CardDescription>Bookings requiring cleaning within the selected date range</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="from" className="text-sm whitespace-nowrap">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-40"
                  data-testid="input-from-date"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="to" className="text-sm whitespace-nowrap">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-40"
                  data-testid="input-to-date"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="needs_assignment">Needs Assignment</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : demand.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No bookings found</h3>
              <p className="text-muted-foreground mt-1">No bookings match your current filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check-out Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demand.map((item: DemandItem) => (
                  <TableRow key={item.bookingId} data-testid={`row-demand-${item.bookingId}`}>
                    <TableCell className="font-medium">{format(new Date(item.checkOut), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.propertyName}</div>
                        <div className="text-xs text-muted-foreground">{item.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.guestName}</TableCell>
                    <TableCell>{item.hostName}</TableCell>
                    <TableCell>${item.amount}</TableCell>
                    <TableCell>{getStatusBadge(item.demandStatus)}</TableCell>
                    <TableCell>
                      {item.assignedCleanerName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {item.assignedCleanerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.demandStatus !== "completed" && (
                        <Button
                          variant={item.demandStatus === "needs_assignment" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAssigningBookingId(item.bookingId);
                            setSelectedCleanerId(null);
                          }}
                          data-testid={`button-assign-${item.bookingId}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {item.demandStatus === "needs_assignment" ? "Assign" : "Reassign"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assigningBookingId} onOpenChange={(open) => { if (!open) { setAssigningBookingId(null); setSelectedCleanerId(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Cleaner</DialogTitle>
            <DialogDescription>
              Select a cleaner to assign to this cleaning job
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {candidatesLoading ? (
              <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            ) : candidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No cleaners available</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {candidates.map((candidate: any) => (
                  <div
                    key={candidate.cleanerId}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCleanerId === candidate.cleanerId 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedCleanerId(candidate.cleanerId)}
                    data-testid={`candidate-${candidate.cleanerId}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-full">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {candidate.existingJobsCountForDay} job{candidate.existingJobsCountForDay !== 1 ? "s" : ""} that day
                      </div>
                      {candidate.hasConflict && (
                        <Badge variant="outline" className="text-amber-600">Conflict</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssigningBookingId(null); setSelectedCleanerId(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedCleanerId || assignJob.isPending}
              data-testid="button-confirm-assign"
            >
              {assignJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Cleaner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
