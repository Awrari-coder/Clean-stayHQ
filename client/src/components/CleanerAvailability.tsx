import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, Trash2, Plus } from "lucide-react";
import { useCleanerAvailability, useUpdateAvailability, useCleanerTimeOff, useAddTimeOff, useDeleteTimeOff } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface AvailabilitySlot {
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export function CleanerAvailability() {
  const { data: availability = [], isLoading: availabilityLoading } = useCleanerAvailability();
  const { data: timeOffs = [], isLoading: timeOffLoading } = useCleanerTimeOff();
  const updateAvailability = useUpdateAvailability();
  const addTimeOff = useAddTimeOff();
  const deleteTimeOff = useDeleteTimeOff();

  const [schedule, setSchedule] = useState<AvailabilitySlot[]>(() => 
    DAYS_OF_WEEK.map((_, i) => ({
      weekday: i,
      startTime: "09:00",
      endTime: "17:00",
      enabled: i >= 1 && i <= 5,
    }))
  );

  const [newTimeOff, setNewTimeOff] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (availability.length > 0) {
      const defaultSchedule = DAYS_OF_WEEK.map((_, i) => ({
        weekday: i,
        startTime: "09:00",
        endTime: "17:00",
        enabled: false,
      }));
      
      availability.forEach((slot: any) => {
        const idx = slot.weekday;
        if (idx >= 0 && idx < 7) {
          defaultSchedule[idx] = {
            weekday: idx,
            startTime: slot.startTime,
            endTime: slot.endTime,
            enabled: true,
          };
        }
      });
      setSchedule(defaultSchedule);
    }
  }, [availability]);

  const handleToggleDay = (dayIndex: number) => {
    const updated = [...schedule];
    updated[dayIndex].enabled = !updated[dayIndex].enabled;
    setSchedule(updated);
  };

  const handleTimeChange = (dayIndex: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...schedule];
    updated[dayIndex][field] = value;
    setSchedule(updated);
  };

  const handleSaveSchedule = async () => {
    const enabledSlots = schedule
      .filter(s => s.enabled)
      .map(s => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

    try {
      await updateAvailability.mutateAsync({ availability: enabledSlots });
      toast({
        title: "Schedule Updated",
        description: "Your weekly availability has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to save your schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTimeOff = async () => {
    if (!newTimeOff.startDate || !newTimeOff.endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addTimeOff.mutateAsync(newTimeOff);
      setNewTimeOff({ startDate: "", endDate: "", reason: "" });
      toast({
        title: "Time Off Added",
        description: "Your time off request has been saved.",
      });
    } catch (error) {
      toast({
        title: "Failed to Add",
        description: "Failed to add time off. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeOff = async (id: number) => {
    try {
      await deleteTimeOff.mutateAsync(id);
      toast({
        title: "Time Off Removed",
        description: "Your time off has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete time off. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
      
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Set your regular working hours for each day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          {availabilityLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, index) => (
                <div 
                  key={day} 
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    schedule[index].enabled ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                  }`}
                  data-testid={`day-schedule-${index}`}
                >
                  <Switch
                    checked={schedule[index].enabled}
                    onCheckedChange={() => handleToggleDay(index)}
                    data-testid={`switch-day-${index}`}
                  />
                  <span className="w-24 font-medium">{day}</span>
                  {schedule[index].enabled && (
                    <>
                      <Input
                        type="time"
                        value={schedule[index].startTime}
                        onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                        className="w-32"
                        data-testid={`input-start-${index}`}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={schedule[index].endTime}
                        onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                        className="w-32"
                        data-testid={`input-end-${index}`}
                      />
                    </>
                  )}
                  {!schedule[index].enabled && (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={handleSaveSchedule} 
                disabled={updateAvailability.isPending}
                className="mt-4"
                data-testid="button-save-schedule"
              >
                {updateAvailability.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Time Off</CardTitle>
          <CardDescription>Block out dates when you're not available for cleaning jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newTimeOff.startDate}
                  onChange={(e) => setNewTimeOff(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-time-off-start"
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newTimeOff.endDate}
                  onChange={(e) => setNewTimeOff(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-time-off-end"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Vacation, personal, etc."
                  value={newTimeOff.reason}
                  onChange={(e) => setNewTimeOff(prev => ({ ...prev, reason: e.target.value }))}
                  data-testid="input-time-off-reason"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddTimeOff} 
                  disabled={addTimeOff.isPending}
                  data-testid="button-add-time-off"
                >
                  {addTimeOff.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add
                </Button>
              </div>
            </div>

            {timeOffLoading ? (
              <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            ) : timeOffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No scheduled time off</div>
            ) : (
              <div className="space-y-2">
                {timeOffs.map((timeOff: any) => (
                  <div 
                    key={timeOff.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    data-testid={`time-off-${timeOff.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">
                          {format(new Date(timeOff.startDate), 'MMM dd, yyyy')} 
                          {" - "}
                          {format(new Date(timeOff.endDate), 'MMM dd, yyyy')}
                        </span>
                        {timeOff.reason && (
                          <p className="text-sm text-muted-foreground">{timeOff.reason}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTimeOff(timeOff.id)}
                      disabled={deleteTimeOff.isPending}
                      data-testid={`button-delete-time-off-${timeOff.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
