import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import HostDashboard from "@/pages/HostDashboard";
import CleanerDashboard from "@/pages/CleanerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/host" component={HostDashboard} />
      <Route path="/host/*" component={HostDashboard} /> {/* Catch-all for sub-routes for now */}
      <Route path="/cleaner" component={CleanerDashboard} />
      <Route path="/cleaner/*" component={CleanerDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/*" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
