import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function AdminBypassPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [activeTab, setActiveTab] = useState("token");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Check for existing admin token on load
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
      verifyAdminToken(storedToken);
    }
  }, []);

  // Verify the admin token with the server
  const verifyAdminToken = async (token: string) => {
    try {
      console.log("Verifying admin token:", token.substring(0, 10) + "...");
      
      const response = await fetch('/api/auth/verify-admin-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log("Token verification response:", response.status, data);

      if (response.ok) {
        setUser(data.user);
        setTokenVerified(true);
        console.log("Token verified successfully for user:", data.user.username);
        return true;
      } else {
        console.error("Token verification failed:", data.message);
        toast({
          title: "Token Error",
          description: data.message || "Invalid admin token",
          variant: "destructive",
        });
        localStorage.removeItem('adminToken');
        setAdminToken(null);
        setTokenVerified(false);
        return false;
      }
    } catch (error) {
      console.error("Error verifying admin token:", error);
      toast({
        title: "Token Error",
        description: "Failed to verify admin token",
        variant: "destructive",
      });
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setTokenVerified(false);
      return false;
    }
  };

  // Get admin token using the new token-based approach
  const handleGetAdminToken = async () => {
    setIsLoading(true);
    setError(null);
    addDebugLog("Requesting admin token for user: " + username);

    try {
      // Check authentication status first
      addDebugLog("Checking current authentication status...");
      try {
        const authCheck = await fetch('/api/auth/debug');
        const authData = await authCheck.json();
        addDebugLog(`Auth status: ${authData.isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
        addDebugLog(`Session ID: ${authData.sessionId}`);
      } catch (authError) {
        addDebugLog(`Auth check error: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
      }
      
      // Request admin token
      addDebugLog("Sending admin token request...");
      const response = await fetch("/api/auth/admin-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      addDebugLog(`Admin token response: Status ${response.status}`);

      if (!response.ok) {
        addDebugLog(`Token request failed: ${data.message || "Failed to get admin token"}`);
        throw new Error(data.message || "Failed to get admin token");
      }

      // Save token and user info
      const { adminToken, user } = data;
      addDebugLog(`Token received for user: ${user.username} (ID: ${user.id})`);
      
      // Log token details
      try {
        const decoded = atob(adminToken);
        addDebugLog(`Token decoded: ${decoded}`);
        
        const parts = decoded.split(':');
        // New token format (admin:userId:issuedAt:expiresAt:signature)
        if (parts.length === 5 && parts[0] === 'admin') {
          const [prefix, userId, issuedAt, expiresAt, signature] = parts;
          const expiry = new Date(parseInt(expiresAt));
          const now = Date.now();
          const remainingMin = Math.max(0, (parseInt(expiresAt) - now) / 60000).toFixed(1);
          
          addDebugLog(`Token format: Enhanced (with signature)`);
          addDebugLog(`User ID: ${userId}`);
          addDebugLog(`Token issued at: ${new Date(parseInt(issuedAt)).toLocaleString()}`);
          addDebugLog(`Token expires at: ${expiry.toLocaleString()}`);
          addDebugLog(`Time remaining: ${remainingMin} minutes`);
        } 
        // Legacy token format (admin:userId:timestamp)
        else if (parts.length === 3 && parts[0] === 'admin') {
          const [prefix, userId, timestamp] = parts;
          const expiryTime = parseInt(timestamp) + (7 * 24 * 60 * 60 * 1000); // 7 days validity
          const expiry = new Date(expiryTime);
          
          addDebugLog(`Token format: Legacy`);
          addDebugLog(`User ID: ${userId}`);
          addDebugLog(`Token created at: ${new Date(parseInt(timestamp)).toLocaleString()}`);
          addDebugLog(`Token expires at: ${expiry.toLocaleString()}`);
        } else {
          addDebugLog(`Unknown token format, parts: ${parts.length}`);
        }
      } catch (decodeError) {
        addDebugLog(`Token decode error: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
      }
      
      // Store token
      localStorage.setItem('adminToken', adminToken);
      setAdminToken(adminToken);
      setUser(user);
      
      // Verify token with server
      addDebugLog("Verifying token with server...");
      const verifyResult = await verifyAdminToken(adminToken);
      addDebugLog(`Token verification result: ${verifyResult ? 'Success' : 'Failed'}`);
      setTokenVerified(verifyResult);

      toast({
        title: "Admin Token Created!",
        description: "You now have admin access for 7 days",
        variant: "default",
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Admin token error:", err);
      addDebugLog(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setError(err instanceof Error ? err.message : "Failed to get admin token");
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get admin token",
        variant: "destructive",
      });
    }
  };

  // Handle going to admin area
  const goToAdmin = () => {
    if (adminToken && tokenVerified) {
      console.log("Redirecting to admin dashboard with valid token");
      setLocation("/admin/dashboard");
    } else {
      toast({
        title: "Error",
        description: "You need a valid admin token first",
        variant: "destructive",
      });
    }
  };

  // Clear admin token
  const clearAdminToken = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setUser(null);
    setTokenVerified(false);
    
    toast({
      title: "Admin Token Cleared",
      description: "Your admin access has been revoked",
      variant: "default",
    });
  };

  // Add log entry
  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };
  
  // Toggle debug info display
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };
  
  // Debug: Check for token
  const checkStoredToken = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      addDebugLog(`Found token in localStorage: ${token.substring(0, 10)}...`);
      return token;
    } else {
      addDebugLog('No token found in localStorage');
      return null;
    }
  };
  
  // Debug: Test token verification
  const testTokenVerification = async () => {
    const token = checkStoredToken();
    if (token) {
      addDebugLog('Testing token verification...');
      try {
        const response = await fetch('/api/auth/verify-admin-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        addDebugLog(`Verification response: ${response.status} ${response.statusText}`);
        addDebugLog(`Response data: ${JSON.stringify(data)}`);
      } catch (error) {
        addDebugLog(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  return (
    <Layout>
      <div className="container max-w-xl py-8">
        <Card className="border-2 border-amber-200 mb-4">
          <CardHeader className="bg-amber-50">
            <CardTitle className="text-amber-700 flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Direct admin authentication for troubleshooting. This page uses token-based authentication
              instead of sessions to bypass authentication issues.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {adminToken && tokenVerified ? (
              <div className="space-y-4">
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Admin Access Granted</AlertTitle>
                  <AlertDescription>
                    You have active admin access as {user?.username}. 
                    Your token is valid for 7 days from creation.
                  </AlertDescription>
                </Alert>
                
                <div className="overflow-hidden rounded-md border bg-white">
                  <div className="px-4 py-3 bg-muted/50">
                    <h3 className="text-sm font-medium">Admin User Details</h3>
                  </div>
                  <div className="px-4 py-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Username:</span>
                      <span>{user?.username}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Email:</span>
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Admin Status:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-md border bg-white">
                  <div className="px-4 py-3 bg-muted/50 flex justify-between items-center">
                    <h3 className="text-sm font-medium">Token Preview</h3>
                    <Badge variant="outline" className="text-xs">For debug only</Badge>
                  </div>
                  <div className="px-4 py-3 text-xs font-mono bg-black text-green-400 overflow-auto">
                    {adminToken}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <KeyRound className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Improved Admin Access Available</AlertTitle>
                  <AlertDescription className="mt-2">
                    We've implemented a new, more reliable login system. Try our dedicated admin login page
                    for a more consistent experience.
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/admin-login')}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        Go to Admin Login
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-md">
                  <h3 className="text-sm font-medium text-amber-800">Legacy Token Generator</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    This method is maintained for backward compatibility only.
                    We recommend using the new Admin Login page instead.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Admin Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between bg-amber-50 flex-wrap gap-2">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/debug')}
                disabled={isLoading}
                size="sm"
              >
                Back to Debug
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/admin-token-debug')}
                size="sm"
              >
                Token Debug
              </Button>
              
              <Button
                variant="secondary"
                onClick={toggleDebugInfo}
                size="sm"
              >
                {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </div>
            
            {adminToken && tokenVerified ? (
              <div className="space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={clearAdminToken}
                  size="sm"
                >
                  Clear Token
                </Button>
                <Button 
                  onClick={goToAdmin}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Go to Admin
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleGetAdminToken}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting token...
                  </>
                ) : (
                  "Get Admin Token"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {showDebugInfo && (
          <Card className="border-2 border-slate-200">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-slate-700 text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Debug Tools
              </CardTitle>
              <CardDescription>
                Tools to help troubleshoot admin token issues
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkStoredToken}
                  >
                    Check Stored Token
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testTokenVerification}
                  >
                    Test Token Verification
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDebugLog([]);
                      addDebugLog('Debug log cleared');
                    }}
                  >
                    Clear Logs
                  </Button>
                </div>
                
                <div className="overflow-hidden rounded-md border">
                  <div className="px-3 py-2 bg-muted/50 flex justify-between items-center">
                    <h3 className="text-xs font-medium">Debug Log</h3>
                    <Badge variant="outline" className="text-xs">{debugLog.length} entries</Badge>
                  </div>
                  <div className="p-3 text-xs font-mono bg-black text-green-400 overflow-auto h-40">
                    {debugLog.length === 0 ? (
                      <div className="text-slate-500">No log entries yet. Use the debug tools above.</div>
                    ) : (
                      debugLog.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}