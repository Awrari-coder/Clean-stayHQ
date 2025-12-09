import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SocketProvider } from "@/hooks/useSocket";
import { ROLE_HOME, type UserRole } from "@/config/sidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import HostDashboard from "@/pages/HostDashboard";
import CleanerDashboard from "@/pages/CleanerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType; 
  allowedRoles: string[] 
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  const userRole = user!.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    const correctPath = ROLE_HOME[userRole] || "/";
    return <Redirect to={correctPath} />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/host">
        {() => <ProtectedRoute component={HostDashboard} allowedRoles={["host"]} />}
      </Route>
      <Route path="/host/:rest*">
        {() => <ProtectedRoute component={HostDashboard} allowedRoles={["host"]} />}
      </Route>
      <Route path="/cleaner">
        {() => <ProtectedRoute component={CleanerDashboard} allowedRoles={["cleaner", "cleaning_company"]} />}
      </Route>
      <Route path="/cleaner/:rest*">
        {() => <ProtectedRoute component={CleanerDashboard} allowedRoles={["cleaner", "cleaning_company"]} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/admin/:rest*">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
