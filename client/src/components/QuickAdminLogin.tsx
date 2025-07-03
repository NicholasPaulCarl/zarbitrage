import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function QuickAdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Call our new endpoint that doesn't require session authentication
      const response = await fetch("/api/auth/generate-admin-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate admin token");
      }
      
      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem("adminToken", data.token);
      
      setSuccess("Admin token generated successfully!");
      toast({
        title: "Admin Access Granted",
        description: "You now have admin access.",
      });
      
      // Navigate directly to admin dashboard (no delay)
      setLocation("/admin");
      
    } catch (err) {
      console.error("Quick login error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast({
        title: "Login Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Quick Admin Access</CardTitle>
        <CardDescription>
          Use this option to bypass session authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          This will automatically create an admin token without requiring session authentication.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleQuickLogin} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Generating Token..." : "Quick Admin Login"}
        </Button>
      </CardFooter>
    </Card>
  );
}