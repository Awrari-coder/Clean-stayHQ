import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useHostProperties, useHostSyncLogs, usePropertySync } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function HostCalendarSettings() {
  const { data: properties = [], isLoading: propertiesLoading } = useHostProperties();
  const { data: syncLogs = [], isLoading: logsLoading } = useHostSyncLogs();
  const propertySync = usePropertySync();

  const handleSync = async (propertyId: number, propertyName: string) => {
    try {
      await propertySync.mutateAsync(propertyId);
      toast({
        title: "Sync Started",
        description: `Calendar sync initiated for ${propertyName}`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusBadge = (property: any) => {
    if (!property.lastSyncAt) {
      return <Badge variant="outline" className="text-muted-foreground">Never synced</Badge>;
    }
    if (property.lastSyncStatus === "success") {
      return <Badge className="bg-emerald-500/15 text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Synced</Badge>;
    }
    if (property.lastSyncStatus === "error") {
      return <Badge className="bg-red-500/15 text-red-600"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Calendar Settings</h1>
      
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Property Sync Status</CardTitle>
          <CardDescription>Monitor and manage calendar synchronization for each property</CardDescription>
        </CardHeader>
        <CardContent>
          {propertiesLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No properties found. Add a property to enable calendar sync.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>iCal URL</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property: any) => (
                  <TableRow key={property.id} data-testid={`row-property-sync-${property.id}`}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {property.icalUrl || "Not configured"}
                    </TableCell>
                    <TableCell>
                      {property.lastSyncAt ? format(new Date(property.lastSyncAt), 'MMM dd, HH:mm') : "-"}
                    </TableCell>
                    <TableCell>{getSyncStatusBadge(property)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(property.id, property.name)}
                        disabled={propertySync.isPending || !property.icalUrl}
                        data-testid={`button-sync-${property.id}`}
                      >
                        {propertySync.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Sync Now</span>
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
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>Log of recent calendar synchronization events</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sync history available</div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {syncLogs.map((log: any) => (
                <div 
                  key={log.id} 
                  className={`p-3 rounded-lg border ${
                    log.status === "success" ? "bg-emerald-50 border-emerald-200" :
                    log.status === "error" ? "bg-red-50 border-red-200" :
                    "bg-muted/50"
                  }`}
                  data-testid={`sync-log-${log.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : log.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{log.propertyName || log.source}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.syncedAt ? format(new Date(log.syncedAt), 'MMM dd, HH:mm') : "-"}
                    </span>
                  </div>
                  {log.message && (
                    <p className="text-sm text-muted-foreground mt-1 ml-6">{log.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
