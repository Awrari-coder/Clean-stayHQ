import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  CheckCircle, 
  DollarSign, 
  Home, 
  Users, 
  Brush,
  RefreshCw,
  Bell
} from "lucide-react";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, typeof Activity> = {
  "property.created": Home,
  "booking.synced": Calendar,
  "job.created": Brush,
  "job.assigned": Users,
  "job.completed": CheckCircle,
  "payout.created": DollarSign,
  "payout.completed": DollarSign,
  "sync.completed": RefreshCw,
  default: Activity,
};

const typeColors: Record<string, string> = {
  "property.created": "bg-blue-100 text-blue-600",
  "booking.synced": "bg-purple-100 text-purple-600",
  "job.created": "bg-orange-100 text-orange-600",
  "job.assigned": "bg-green-100 text-green-600",
  "job.completed": "bg-emerald-100 text-emerald-600",
  "payout.created": "bg-yellow-100 text-yellow-600",
  "payout.completed": "bg-green-100 text-green-600",
  default: "bg-gray-100 text-gray-600",
};

interface ActivityFeedProps {
  title?: string;
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({ 
  title = "Recent Activity", 
  maxItems = 15,
  className = ""
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const { isConnected } = useSocket();

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/activity/feed?limit=${maxItems}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleNewActivity = useCallback((data: ActivityItem) => {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === data.id);
      if (exists) return prev;
      setNewCount((c) => c + 1);
      setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 3000);
      return [data, ...prev].slice(0, maxItems);
    });
  }, [maxItems]);

  useSocketEvent("activity:new", handleNewActivity);

  const getIcon = (type: string) => {
    const Icon = typeIcons[type] || typeIcons.default;
    return Icon;
  };

  const getColorClass = (type: string) => {
    return typeColors[type] || typeColors.default;
  };

  if (isLoading) {
    return (
      <Card className={`border-none shadow-md ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-none shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                {newCount} new
              </Badge>
            )}
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activities.map((activity, index) => {
                const Icon = getIcon(activity.type);
                const colorClass = getColorClass(activity.type);
                const isNew = index === 0 && newCount > 0;
                
                return (
                  <div 
                    key={activity.id}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${
                      isNew ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
                    }`}
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
