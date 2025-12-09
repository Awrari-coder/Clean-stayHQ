import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Calendar, CheckCircle, Clock } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { formatDistanceToNow } from "date-fns";

interface SystemStatus {
  lastSchedulerRunAt: string | null;
  lastCalendarSyncAt: string | null;
  pendingJobsCount: number;
  activeJobsToday: number;
  completedJobsToday: number;
}

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

function getHealthStatus(timestamp: string | null): HealthStatus {
  if (!timestamp) return "unknown";
  
  const lastRun = new Date(timestamp);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);
  
  if (diffMinutes < 15) return "healthy";
  if (diffMinutes < 60) return "warning";
  return "critical";
}

function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case "healthy": return "bg-green-500";
    case "warning": return "bg-yellow-500";
    case "critical": return "bg-red-500";
    default: return "bg-gray-400";
  }
}

function getHealthLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy": return "Healthy";
    case "warning": return "Delayed";
    case "critical": return "Critical";
    default: return "Unknown";
  }
}

export function SystemHeartbeat() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/system-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch system status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !status) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            System Heartbeat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Activity className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const schedulerHealth = getHealthStatus(status.lastSchedulerRunAt);
  const syncHealth = getHealthStatus(status.lastCalendarSyncAt);
  const overallHealth = schedulerHealth === "healthy" && syncHealth === "healthy" 
    ? "healthy" 
    : schedulerHealth === "critical" || syncHealth === "critical"
      ? "critical"
      : "warning";

  return (
    <Card className="border-none shadow-md" data-testid="system-heartbeat">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            System Heartbeat
          </CardTitle>
          <div className="flex items-center gap-2">
            <div 
              className={`h-3 w-3 rounded-full animate-pulse ${getHealthColor(overallHealth)}`}
            />
            <Badge 
              variant={overallHealth === "healthy" ? "default" : "destructive"}
              className={overallHealth === "warning" ? "bg-yellow-500" : ""}
            >
              {getHealthLabel(overallHealth)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              Pending
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={status.pendingJobsCount} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Activity className="h-3 w-3" />
              Active Today
            </div>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={status.activeJobsToday} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <CheckCircle className="h-3 w-3" />
              Done Today
            </div>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={status.completedJobsToday} />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getHealthColor(schedulerHealth)}`} />
              <span className="text-muted-foreground">Scheduler</span>
            </div>
            <span>
              {status.lastSchedulerRunAt 
                ? formatDistanceToNow(new Date(status.lastSchedulerRunAt), { addSuffix: true })
                : "Never"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getHealthColor(syncHealth)}`} />
              <span className="text-muted-foreground">Calendar Sync</span>
            </div>
            <span>
              {status.lastCalendarSyncAt 
                ? formatDistanceToNow(new Date(status.lastCalendarSyncAt), { addSuffix: true })
                : "Never"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
