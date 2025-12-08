import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Settings, Users, ShieldAlert, BarChart3, Bell } from "lucide-react";
import { MOCK_USERS } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const handleSystemCheck = () => {
    toast({
      title: "Running System Diagnostics",
      description: "Checking database integrity and API connections...",
    });
  };

  const handleSendAlert = () => {
    toast({
      title: "Alert Sent",
      description: "SMS broadcast sent to all active cleaners via Twilio.",
      variant: "default",
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
            <p className="text-muted-foreground mt-1">Overview of Texas Region operations.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="destructive" onClick={handleSendAlert}>
               <Bell className="mr-2 h-4 w-4" /> Broadcast Alert
             </Button>
             <Button variant="outline" onClick={handleSystemCheck}>
               <Settings className="mr-2 h-4 w-4" /> System Check
             </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="h-6 w-6" /> Operational
              </div>
              <p className="text-xs opacity-80 mt-1">All systems normal. 99.9% Uptime.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_USERS.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hosts: 1 | Cleaners: 2 | Admins: 1
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-6 w-6" /> 2
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>All registered users in the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USERS.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <CardDescription>Status of external API connections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-[#FF5A5F] text-white p-2 rounded-md">
                    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22.519 8.014c-.117-.506-.355-.989-.705-1.408l-5.627-7.235c-.47-.57-1.166-.884-1.92-.868h-.006c-.742.008-1.433.32-1.897.876L2.247 11.83c-.318.423-.526.906-.612 1.416-.088.527-.035 1.066.155 1.564.188.498.504.939.914 1.272l1.69 1.472c.45.39.993.636 1.57.708.577.07 1.157-.035 1.637-.306.495-.28 1.117-.28 1.611 0l.002.002c.49.278 1.082.385 1.67.303.587-.08 1.135-.337 1.58-.737l.078-.078 5.626-5.88c.382-.416.657-.91.794-1.43.136-.52.127-1.068-.024-1.582-.153-.513-.438-.97-.822-1.314l-1.38-1.12c-.524-.425-1.18-.636-1.847-.594-.666.042-1.298.31-1.78.756-.47.435-1.18.435-1.65 0-.47-.436-.47-1.144 0-1.58.742-.686 1.714-1.098 2.738-1.162 1.025-.065 2.034.258 2.84.91l1.38 1.12c.59.496 1.027 1.158 1.26 1.886.234.727.248 1.51.04 2.248zM12.002 4.542l.006.008c.245.297.604.463.998.463h.005c.4 0 .765-.17 1.015-.477l5.244-6.744c.184-.236.31-.504.37-.788.06-.284.03-.574-.087-.837-.116-.26-.293-.476-.51-.62-.218-.145-.475-.205-.724-.17-.25.034-.48.152-.65.33l-5.667 6.835z"/></svg>
                  </div>
                  <div>
                    <p className="font-medium">Airbnb Integration</p>
                    <p className="text-sm text-muted-foreground">Connected • Syncing every 15m</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-[#F22F46] text-white p-2 rounded-md">
                     <div className="h-5 w-5 font-bold flex items-center justify-center">Tw</div>
                  </div>
                  <div>
                    <p className="font-medium">Twilio SMS</p>
                    <p className="text-sm text-muted-foreground">Connected • 420 messages sent</p>
                  </div>
                </div>
                 <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-2 rounded-md">
                    <div className="h-5 w-5 font-bold flex items-center justify-center">R</div>
                  </div>
                  <div>
                    <p className="font-medium">Resend Email</p>
                    <p className="text-sm text-muted-foreground">Connected • 1,200 emails sent</p>
                  </div>
                </div>
                 <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
