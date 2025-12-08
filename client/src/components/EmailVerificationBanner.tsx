import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, X } from "lucide-react";

export function EmailVerificationBanner() {
  const { user, token } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        setMessage("Verification email sent! Check your inbox.");
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to send verification email");
      }
    } catch (error) {
      setMessage("Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" data-testid="email-verification-banner">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-amber-800 dark:text-amber-200">
          {message || "Please verify your email to fully activate your account."}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResend} 
            disabled={isResending}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            data-testid="button-resend-verification"
          >
            {isResending ? "Sending..." : "Resend link"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800"
            data-testid="button-dismiss-verification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
