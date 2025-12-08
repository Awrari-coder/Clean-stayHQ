import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Link2, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";

interface Property {
  id: number;
  name: string;
  icalUrl?: string | null;
}

interface ConnectCalendarProps {
  properties: Property[];
  onSyncComplete?: () => void;
}

export function ConnectCalendar({ properties, onSyncComplete }: ConnectCalendarProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [icalUrl, setIcalUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  async function saveIcalUrl() {
    if (!selectedPropertyId || !icalUrl) {
      toast({
        title: "Missing Information",
        description: "Please select a property and enter an iCal URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/host/properties/${selectedPropertyId}/ical`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ icalUrl }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({
        title: "Calendar Connected",
        description: "Your Airbnb calendar URL has been saved. Click Sync Now to import bookings.",
      });
      setIcalUrl("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save iCal URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function syncNow() {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/host/sync", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to sync");

      const data = await res.json();
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.synced || 0} properties. New bookings have been imported.`,
      });
      onSyncComplete?.();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar. Please check your iCal URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Card className="border-primary/20" data-testid="card-connect-calendar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Connect Airbnb Calendar
        </CardTitle>
        <CardDescription>
          Import your bookings automatically by connecting your Airbnb iCal feed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="property">Select Property</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger data-testid="select-property">
              <SelectValue placeholder="Choose a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} {p.icalUrl && <CheckCircle className="inline h-3 w-3 text-green-500 ml-2" />}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ical-url">Airbnb iCal URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ical-url"
                className="pl-10"
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                data-testid="input-ical-url"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Find this in Airbnb → Your Listing → Availability → Export Calendar
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={saveIcalUrl} 
            disabled={isSaving || !selectedPropertyId || !icalUrl}
            data-testid="button-save-ical"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Save Calendar URL
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={syncNow} 
            disabled={isSyncing}
            data-testid="button-sync-now"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
