import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Shield, Star, DollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import heroImage from '@assets/generated_images/modern_clean_vacation_rental_living_room.png';

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in - use actual user role
  useEffect(() => {
    if (isAuthenticated && user) {
      let dashboardPath = "/host";
      if (user.role === "admin") {
        dashboardPath = "/admin";
      } else if (user.role === "cleaner" || user.role === "cleaning_company") {
        dashboardPath = "/cleaner";
      }
      setLocation(dashboardPath);
    }
  }, [isAuthenticated, user, setLocation]);

  if (isAuthenticated && user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      // Redirect handled by useEffect when user state updates
    } else {
      toast({
        title: "Login failed",
        description: result.error || "Please check your credentials.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const setDemoCredentials = (role: string) => {
    switch (role) {
      case "host":
        setEmail("sarah@example.com");
        setPassword("password");
        break;
      case "cleaner":
        setEmail("mike@example.com");
        setPassword("password");
        break;
      case "admin":
        setEmail("admin@example.com");
        setPassword("password");
        break;
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="bg-primary h-10 w-10 rounded-lg flex items-center justify-center">
                <span className="font-heading font-bold text-white text-xl">C</span>
              </div>
              <span className="font-heading font-bold text-2xl tracking-tight">CleanStay</span>
            </div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Manage your properties and cleanings with ease.</p>
          </div>

          <Tabs defaultValue="host" className="w-full" onValueChange={setDemoCredentials}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="host" data-testid="tab-host">Host</TabsTrigger>
              <TabsTrigger value="cleaner" data-testid="tab-cleaner">Cleaner</TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>
            </TabsList>

            {["host", "cleaner", "admin"].map((role) => (
              <TabsContent key={role} value={role}>
                <Card className="border-none shadow-none">
                  <form onSubmit={handleLogin}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${role}-email`}>Email</Label>
                        <Input 
                          id={`${role}-email`}
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid={`input-email-${role}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${role}-password`}>Password</Label>
                        <Input 
                          id={`${role}-password`} 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          data-testid={`input-password-${role}`}
                        />
                      </div>
                      <Button 
                        className="w-full font-medium" 
                        type="submit" 
                        disabled={isLoading}
                        data-testid={`button-login-${role}`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo Accounts (password: "password"):</p>
            <p>Host: sarah@example.com</p>
            <p>Cleaner: mike@example.com</p>
            <p>Admin: admin@example.com</p>
          </div>
        </div>
      </div>

      {/* Right: Image */}
      <div className="hidden lg:block relative bg-muted">
        <img 
          src={heroImage} 
          alt="Modern Vacation Rental" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="max-w-md space-y-4 mb-8">
            <div className="flex gap-2">
              <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
              <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
              <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
              <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
              <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
            </div>
            <h2 className="text-3xl font-heading font-bold">"CleanStay has revolutionized how we manage our 15 Austin properties. It's simply essential."</h2>
            <p className="font-medium opacity-90">— Sarah Jenkins, Superhost</p>
          </div>
          <div className="flex gap-6 text-sm font-medium opacity-80">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Auto-Scheduling
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Verified Cleaners
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Instant Payouts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
