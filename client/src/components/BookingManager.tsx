import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookingDetails, useUpdateBooking, useScheduleCleaning } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, User, Home, FileText, Sparkles, CheckCircle, Loader2 } from "lucide-react";

interface BookingManagerProps {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingManager({ bookingId, open, onOpenChange }: BookingManagerProps) {
  const { data: booking, isLoading, refetch } = useBookingDetails(bookingId);
  const updateBooking = useUpdateBooking();
  const scheduleCleaning = useScheduleCleaning();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    guestName: "",
    hostNotes: "",
    specialInstructions: "",
  });

  const handleEdit = () => {
    if (booking) {
      setFormData({
        guestName: booking.guestName || "",
        hostNotes: booking.hostNotes || "",
        specialInstructions: booking.specialInstructions || "",
      });
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!bookingId) return;
    
    updateBooking.mutate({
      bookingId,
      data: {
        guestName: formData.guestName,
        hostNotes: formData.hostNotes,
        specialInstructions: formData.specialInstructions,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Booking updated", description: "Changes saved successfully" });
        setEditMode(false);
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to update booking", variant: "destructive" });
      }
    });
  };

  const handleScheduleCleaning = (cleaningType: string) => {
    if (!bookingId) return;
    
    scheduleCleaning.mutate({
      bookingId,
      cleaningType,
    }, {
      onSuccess: (data: any) => {
        toast({ 
          title: "Cleaning scheduled", 
          description: `${data.jobsCreated} job(s) created. ${data.jobsAssigned} cleaner(s) assigned.`
        });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to schedule cleaning", variant: "destructive" });
      }
    });
  };

  const getCleaningTypeLabel = (type: string) => {
    switch (type) {
      case "pre_checkout": return "Pre-Checkout";
      case "post_checkout": return "Post-Checkout";
      case "round_trip": return "Round Trip";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      "checked-in": "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getCleaningStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      verified: "bg-green-200 text-green-900",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Details
          </DialogTitle>
          <DialogDescription>
            View and manage this booking
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : booking ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
              <TabsTrigger value="cleaning" data-testid="tab-cleaning">Cleaning</TabsTrigger>
              <TabsTrigger value="checklists" data-testid="tab-checklists">Checklists</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.propertyName}</CardTitle>
                      <CardDescription>{booking.propertyAddress}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(booking.status)}
                      {getCleaningStatusBadge(booking.cleaningStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Guest Name</Label>
                        <Input
                          value={formData.guestName}
                          onChange={(e) => setFormData(f => ({ ...f, guestName: e.target.value }))}
                          data-testid="input-edit-guest-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Special Instructions</Label>
                        <Textarea
                          value={formData.specialInstructions}
                          onChange={(e) => setFormData(f => ({ ...f, specialInstructions: e.target.value }))}
                          placeholder="Instructions for the cleaning team..."
                          data-testid="input-special-instructions"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Host Notes (private)</Label>
                        <Textarea
                          value={formData.hostNotes}
                          onChange={(e) => setFormData(f => ({ ...f, hostNotes: e.target.value }))}
                          placeholder="Personal notes about this booking..."
                          data-testid="input-host-notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={updateBooking.isPending} data-testid="button-save-booking">
                          {updateBooking.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.guestName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      
                      {booking.specialInstructions && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Special Instructions</p>
                          <p className="text-sm text-muted-foreground">{booking.specialInstructions}</p>
                        </div>
                      )}
                      
                      {booking.hostNotes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Your Notes</p>
                          <p className="text-sm text-muted-foreground">{booking.hostNotes}</p>
                        </div>
                      )}
                      
                      <Button onClick={handleEdit} variant="outline" data-testid="button-edit-booking">
                        <FileText className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cleaning" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Schedule Cleaning
                  </CardTitle>
                  <CardDescription>
                    Choose when cleaning should happen for this booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Current type:</span>
                    <Badge variant="outline">{getCleaningTypeLabel(booking.cleaningType)}</Badge>
                  </div>

                  <div className="grid gap-3">
                    <Button 
                      variant={booking.cleaningType === "post_checkout" ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => handleScheduleCleaning("post_checkout")}
                      disabled={scheduleCleaning.isPending}
                      data-testid="button-schedule-post-checkout"
                    >
                      <div className="text-left">
                        <div className="font-medium">Post-Checkout Cleaning</div>
                        <div className="text-sm text-muted-foreground">Clean after the guest leaves</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={booking.cleaningType === "pre_checkout" ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => handleScheduleCleaning("pre_checkout")}
                      disabled={scheduleCleaning.isPending}
                      data-testid="button-schedule-pre-checkout"
                    >
                      <div className="text-left">
                        <div className="font-medium">Pre-Checkout Cleaning</div>
                        <div className="text-sm text-muted-foreground">Clean before the guest leaves (mid-stay refresh)</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={booking.cleaningType === "round_trip" ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => handleScheduleCleaning("round_trip")}
                      disabled={scheduleCleaning.isPending}
                      data-testid="button-schedule-round-trip"
                    >
                      <div className="text-left">
                        <div className="font-medium">Round Trip Cleaning</div>
                        <div className="text-sm text-muted-foreground">Both pre-checkout and post-checkout cleaning</div>
                      </div>
                    </Button>
                  </div>

                  {booking.cleaningJobs && booking.cleaningJobs.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Scheduled Jobs</h4>
                      <div className="space-y-2">
                        {booking.cleaningJobs.map((job: any) => (
                          <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <span className="font-medium">{getCleaningTypeLabel(job.jobType)} Cleaning</span>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(job.scheduledDate), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <Badge>{job.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checklists" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Guest Checklists
                  </CardTitle>
                  <CardDescription>
                    Check-in and check-out tasks for guests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Check-In Checklist</h4>
                    <div className="space-y-2">
                      {(booking.checkInChecklist as string[] || ["Review house rules", "Test WiFi connection", "Check all appliances", "Locate emergency contacts"]).map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Check-Out Checklist</h4>
                    <div className="space-y-2">
                      {(booking.checkOutChecklist as string[] || ["Turn off all lights", "Lock all doors", "Dispose of trash", "Strip beds", "Load dishwasher"]).map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Checklist customization coming soon. Contact support to set up custom checklists for your properties.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Booking not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
