import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, KeyRound, Bug, RefreshCw, X, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function AdminTokenDebugPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [tokenUserId, setTokenUserId] = useState<number | null>(null);
  const [sessionIsAuthenticated, setSessionIsAuthenticated] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [requestHeaders, setRequestHeaders] = useState<string>("");
  const [requestMethod, setRequestMethod] = useState<string>("GET");
  const [requestUrl, setRequestUrl] = useState<string>("/api/admin/users");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [authDebugData, setAuthDebugData] = useState<{
    auth: any;
    sessionDebug: any;
  } | null>(null);

  // Log entry
  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Init - check for stored token
  useEffect(() => {
    checkStoredToken();
    checkSessionStatus();
  }, []);

  // Check for admin token in localStorage
  const checkStoredToken = () => {
    addLog("Checking for stored admin token...");
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      setAdminToken(token);
      addLog(`Found admin token: ${token.substring(0, 10)}...`);
      
      try {
        // Token format is typically base64 encoded "admin:{userId}:{timestamp}"
        const decodedToken = atob(token);
        addLog(`Decoded token: ${decodedToken}`);
        
        const parts = decodedToken.split(':');
        if (parts.length === 3) {
          setTokenUserId(parseInt(parts[1]));
          
          // Calculate expiry (usually 1 hour from timestamp)
          const timestamp = parseInt(parts[2]);
          const expiryDate = new Date(timestamp + 3600000); // 1 hour later
          setTokenExpiry(expiryDate);
          
          const now = new Date();
          if (expiryDate < now) {
            addLog("⚠️ TOKEN EXPIRED! It expired at " + expiryDate.toLocaleTimeString());
          } else {
            const minutesRemaining = Math.round((expiryDate.getTime() - now.getTime()) / 60000);
            addLog(`Token valid for approximately ${minutesRemaining} more minutes`);
          }
        } else {
          addLog("⚠️ Token format is invalid! Expected format: admin:{userId}:{timestamp}");
        }
      } catch (e) {
        addLog(`⚠️ Error decoding token: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } else {
      addLog("⚠️ No admin token found in localStorage");
    }
  };

  // Check session status
  const checkSessionStatus = async () => {
    try {
      addLog("Checking session debug...");
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      
      addLog(`Session debug response status: ${response.status}`);
      setSessionData(data);
      setSessionIsAuthenticated(data.isAuthenticated);
      
      addLog(`Session authenticated: ${data.isAuthenticated}`);
      addLog(`Session ID: ${data.sessionId}`);
    } catch (error) {
      addLog(`⚠️ Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    try {
      addLog("Checking user authentication status...");
      const response = await fetch('/api/auth/user');
      
      if (response.ok) {
        const user = await response.json();
        setUserInfo(user);
        addLog(`Authenticated as user: ${user.username} (ID: ${user.id})`);
        addLog(`User is ${user.isAdmin ? 'an admin' : 'not an admin'}`);
      } else {
        addLog(`⚠️ Not authenticated as a user (${response.status})`);
        setUserInfo(null);
      }
    } catch (error) {
      addLog(`⚠️ Error checking authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test verifying the admin token
  const testTokenVerification = async () => {
    if (!adminToken) {
      addLog("⚠️ No admin token to verify");
      return;
    }
    
    setActiveTest("token-verify");
    setIsLoading(true);
    addLog("Testing admin token verification...");
    
    try {
      const response = await fetch('/api/auth/verify-admin-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResponseStatus(response.status);
      setResponseData(data);
      
      if (response.ok) {
        addLog(`✅ Token verification succeeded (${response.status})`);
        addLog(`Verified for user: ${data.user.username} (ID: ${data.user.id})`);
      } else {
        addLog(`❌ Token verification failed (${response.status}): ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`❌ Error during token verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResponseStatus(null);
      setResponseData(null);
    }
    
    setIsLoading(false);
  };

  // Test admin endpoint with token
  const testAdminEndpoint = async () => {
    if (!adminToken) {
      addLog("⚠️ No admin token to use for testing");
      return;
    }
    
    setActiveTest("admin-endpoint");
    setIsLoading(true);
    
    // Parse custom headers if provided
    const headerObj: Record<string, string> = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    if (requestHeaders.trim()) {
      try {
        requestHeaders.split('\n').forEach(line => {
          const [key, value] = line.split(':').map(part => part.trim());
          if (key && value) {
            headerObj[key] = value;
          }
        });
      } catch (e) {
        addLog(`⚠️ Error parsing headers: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    
    addLog(`Testing admin endpoint: ${requestMethod} ${requestUrl}`);
    addLog(`Using headers: ${JSON.stringify(headerObj, null, 2)}`);
    
    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: headerObj
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setResponseStatus(response.status);
      setResponseData(data);
      
      if (response.ok) {
        addLog(`✅ Endpoint request succeeded (${response.status})`);
      } else {
        addLog(`❌ Endpoint request failed (${response.status})`);
      }
    } catch (error) {
      addLog(`❌ Error during endpoint request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResponseStatus(null);
      setResponseData(null);
    }
    
    setIsLoading(false);
  };

  // Clear all data
  const clearAll = () => {
    if (confirm("This will clear the admin token from localStorage. Continue?")) {
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setTokenExpiry(null);
      setTokenUserId(null);
      setResponseStatus(null);
      setResponseData(null);
      
      addLog("Cleared admin token from localStorage");
      toast({
        title: "Cleared Token",
        description: "Admin token has been removed from localStorage",
        variant: "default",
      });
      
      checkSessionStatus();
    }
  };
  
  // Perform comprehensive auth diagnostic
  const runAuthDiagnostic = async () => {
    setIsLoading(true);
    setActiveTest("auth-diagnostic");
    addLog("Running comprehensive authentication diagnostic...");
    
    try {
      // Step 1: Check session status
      addLog("Step 1: Checking session status...");
      const sessionResponse = await fetch('/api/auth/debug');
      const sessionData = await sessionResponse.json();
      
      addLog(`Session status: ${sessionData.isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
      addLog(`Session ID: ${sessionData.sessionId}`);
      
      if (sessionData.user) {
        addLog(`Session user: ${sessionData.user.username} (ID: ${sessionData.user.id})`);
      } else {
        addLog("No user in session");
      }
      
      // Step 2: Check standard authentication endpoint
      addLog("Step 2: Checking standard auth endpoint...");
      const authResponse = await fetch('/api/auth/user');
      let authData;
      
      try {
        authData = await authResponse.json();
        addLog(`Auth endpoint status: ${authResponse.status}`);
        
        if (authResponse.ok && authData) {
          addLog(`Authenticated as: ${authData.username} (ID: ${authData.id})`);
          addLog(`User is ${authData.isAdmin ? 'an admin' : 'not an admin'}`);
        } else {
          addLog(`Not authenticated via standard endpoint: ${authData.message || 'Unknown reason'}`);
        }
      } catch (e) {
        addLog(`Error parsing auth response: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
      // Step 3: Check admin token if available
      if (adminToken) {
        addLog("Step 3: Checking admin token verification...");
        const tokenResponse = await fetch('/api/auth/verify-admin-token', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        const tokenData = await tokenResponse.json();
        addLog(`Token verification status: ${tokenResponse.status}`);
        
        if (tokenResponse.ok) {
          addLog(`Token verified for user: ${tokenData.user.username} (ID: ${tokenData.user.id})`);
        } else {
          addLog(`Token verification failed: ${tokenData.message || 'Unknown reason'}`);
        }
      } else {
        addLog("Step 3: Skipped - No admin token available");
      }
      
      // Step 4: Try admin endpoint
      if (adminToken) {
        addLog("Step 4: Testing admin endpoint access...");
        const adminResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        addLog(`Admin endpoint status: ${adminResponse.status}`);
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          addLog(`Successfully accessed admin endpoint. Found ${adminData.length} users.`);
        } else {
          try {
            const errorData = await adminResponse.json();
            addLog(`Admin endpoint access failed: ${errorData.message || 'Unknown reason'}`);
          } catch (e) {
            addLog(`Admin endpoint access failed with status ${adminResponse.status}`);
          }
        }
      } else {
        addLog("Step 4: Skipped - No admin token available");
      }
      
      // Store diagnostic results
      setAuthDebugData({
        auth: authData,
        sessionDebug: sessionData
      });
      
      addLog("Authentication diagnostic complete");
      
      toast({
        title: "Diagnostic Complete",
        description: "Authentication diagnostic checks completed",
      });
    } catch (error) {
      addLog(`❌ Error during diagnostic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsLoading(false);
  };

  // Generate dummy token for testing (only for development/debugging)
  const generateDummyToken = () => {
    const userId = tokenUserId || 1;
    const timestamp = Date.now();
    const tokenString = `admin:${userId}:${timestamp}`;
    const encoded = btoa(tokenString);
    
    localStorage.setItem('adminToken', encoded);
    setAdminToken(encoded);
    setTokenExpiry(new Date(timestamp + 86400000)); // 24 hours
    
    addLog(`Generated dummy token for userId ${userId}: ${encoded.substring(0, 10)}...`);
    toast({
      title: "Dummy Token Generated",
      description: "A test token has been created and stored in localStorage",
      variant: "default",
    });
  };
  
  // Direct login with admin credentials
  const [directLoginUsername, setDirectLoginUsername] = useState("admin");
  const [directLoginPassword, setDirectLoginPassword] = useState("admin123");
  const [directLoginLoading, setDirectLoginLoading] = useState(false);
  
  const performDirectLogin = async () => {
    try {
      setDirectLoginLoading(true);
      addLog(`Attempting direct admin login for ${directLoginUsername}...`);
      
      // First, try to clear any existing session
      try {
        const logoutResponse = await fetch('/api/auth/logout', { method: 'POST' });
        const logoutData = await logoutResponse.json();
        addLog(`Cleared previous session before direct login: ${JSON.stringify(logoutData)}`);
      } catch (e) {
        addLog(`Error clearing previous session: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
      // Now try to get admin token with login
      const response = await fetch('/api/auth/admin-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: directLoginUsername,
          password: directLoginPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`Direct login success! Token received for ${data.user.username}`);
        addLog(`Session ID: ${data.sessionId}`);
        addLog(`Session authenticated: ${data.sessionAuthenticated}`);
        
        // Store the token
        localStorage.setItem('adminToken', data.adminToken);
        setAdminToken(data.adminToken);
        
        // Decode token data
        try {
          const decoded = atob(data.adminToken);
          const [prefix, userId, timestamp] = decoded.split(':');
          if (prefix === 'admin' && userId && timestamp) {
            setTokenUserId(parseInt(userId));
            setTokenExpiry(new Date(parseInt(timestamp) + 86400000)); // 24 hours
          }
        } catch (e) {
          addLog(`Error decoding token: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
        
        toast({
          title: "Admin Login Successful",
          description: `Logged in as ${data.user.username} with token and session auth`,
        });
        
        // Refresh session status
        await checkSessionStatus();
      } else {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore parse errors
        }
        
        addLog(`Direct login failed: ${errorMessage}`);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      addLog(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDirectLoginLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Token Debugging</h1>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setLocation('/admin-bypass')}>
              Back to Admin Bypass
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation('/debug')}>
              System Debug
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Token Info Card */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Token Status
              </CardTitle>
              <CardDescription>
                Current admin token information and session status
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">Token Present:</h3>
                  <p className="text-sm text-muted-foreground">In localStorage</p>
                </div>
                {adminToken ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                    No
                  </Badge>
                )}
              </div>
              
              {adminToken && tokenExpiry && (
                <>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">Token Expiry:</h3>
                      <p className="text-sm text-muted-foreground">Valid until</p>
                    </div>
                    <Badge className={tokenExpiry < new Date() ? 
                      "bg-red-100 text-red-800" : 
                      "bg-green-100 text-green-800"}>
                      {tokenExpiry.toLocaleTimeString()}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">Token User ID:</h3>
                      <p className="text-sm text-muted-foreground">Associated user</p>
                    </div>
                    <Badge variant="outline">
                      {tokenUserId}
                    </Badge>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">Session Auth:</h3>
                  <p className="text-sm text-muted-foreground">Session authenticated</p>
                </div>
                {sessionIsAuthenticated ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                    No
                  </Badge>
                )}
              </div>
              
              {userInfo && (
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">User Status:</h3>
                    <p className="text-sm text-muted-foreground">Logged in as</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{userInfo.username}</p>
                    <Badge className={userInfo.isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                      {userInfo.isAdmin ? "Admin" : "Regular User"}
                    </Badge>
                  </div>
                </div>
              )}
              
              {adminToken && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold mb-2">Token Value:</h3>
                  <div className="bg-slate-100 p-2 rounded text-xs font-mono break-all">
                    {adminToken}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-blue-50 flex justify-between">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={checkStoredToken}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Token
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateDummyToken}
                  className="border-amber-300 text-amber-600 hover:bg-amber-50"
                >
                  Generate Test Token
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Testing Tools Card */}
          <Card className="border-2 border-slate-200">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debugging Tools
              </CardTitle>
              <CardDescription>
                Test your admin token with various endpoints
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Tabs defaultValue="token-verify" onValueChange={setActiveTest}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="token-verify">Token Verification</TabsTrigger>
                  <TabsTrigger value="admin-endpoint">Admin Endpoint Test</TabsTrigger>
                  <TabsTrigger value="auth-diagnostic">Full Diagnostic</TabsTrigger>
                </TabsList>
                
                <TabsContent value="token-verify" className="space-y-4">
                  <Alert className="bg-slate-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>About This Test</AlertTitle>
                    <AlertDescription>
                      Tests if your admin token is valid by calling the token verification endpoint.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={testTokenVerification}
                    disabled={isLoading || !adminToken}
                    className="w-full"
                  >
                    {isLoading && activeTest === "token-verify" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Token Verification"
                    )}
                  </Button>
                </TabsContent>
                
                <TabsContent value="admin-endpoint" className="space-y-4">
                  <Alert className="bg-slate-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>About This Test</AlertTitle>
                    <AlertDescription>
                      Tests if your admin token can access protected admin endpoints.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="requestUrl">API Endpoint URL</Label>
                        <Input
                          id="requestUrl"
                          value={requestUrl}
                          onChange={(e) => setRequestUrl(e.target.value)}
                          placeholder="/api/admin/users"
                        />
                      </div>
                      <div>
                        <Label htmlFor="requestMethod">Method</Label>
                        <select
                          id="requestMethod"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={requestMethod}
                          onChange={(e) => setRequestMethod(e.target.value)}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="requestHeaders">Additional Headers (one per line, format: Key: Value)</Label>
                      <Textarea
                        id="requestHeaders"
                        value={requestHeaders}
                        onChange={(e) => setRequestHeaders(e.target.value)}
                        placeholder="X-Custom-Header: Value"
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      onClick={testAdminEndpoint}
                      disabled={isLoading || !adminToken}
                      className="w-full"
                    >
                      {isLoading && activeTest === "admin-endpoint" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Admin Endpoint"
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="auth-diagnostic" className="space-y-4">
                  <Alert className="bg-slate-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Comprehensive Auth Diagnostic</AlertTitle>
                    <AlertDescription>
                      Runs a full diagnostic on session authentication, token verification, and permission checks.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={runAuthDiagnostic}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading && activeTest === "auth-diagnostic" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Diagnostic...
                      </>
                    ) : (
                      "Run Complete Auth Diagnostic"
                    )}
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Direct Admin Login</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="adminUsername">Admin Username</Label>
                        <Input
                          id="adminUsername"
                          value={directLoginUsername}
                          onChange={(e) => setDirectLoginUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Admin Password</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          value={directLoginPassword}
                          onChange={(e) => setDirectLoginPassword(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={performDirectLogin}
                        disabled={directLoginLoading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {directLoginLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login & Get Token"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This performs a direct login with the admin credentials and automatically
                      sets up both token and session authentication.
                    </p>
                  </div>
                  
                  {authDebugData && (
                    <div className="space-y-3 mt-4">
                      <div className="rounded-md border">
                        <div className="bg-slate-50 px-4 py-2 border-b">
                          <h3 className="font-medium text-sm">Authentication Status</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Session Authentication:</span>
                            <Badge variant="outline" className={
                              authDebugData.sessionDebug?.isAuthenticated 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }>
                              {authDebugData.sessionDebug?.isAuthenticated ? "Authenticated" : "Not Authenticated"}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Session ID:</span>
                            <code className="text-xs bg-slate-100 p-1 rounded">
                              {authDebugData.sessionDebug?.sessionId || "None"}
                            </code>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">API Authentication:</span>
                            <Badge variant="outline" className={
                              authDebugData.auth && !authDebugData.auth.message
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }>
                              {authDebugData.auth && !authDebugData.auth.message ? "Authenticated" : "Not Authenticated"}
                            </Badge>
                          </div>
                          
                          {authDebugData.auth && !authDebugData.auth.message && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">User Type:</span>
                              <Badge variant={authDebugData.auth.isAdmin ? "default" : "outline"}>
                                {authDebugData.auth.isAdmin ? "Admin" : "Regular User"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="rounded-md border">
                        <div className="bg-slate-50 px-4 py-2 border-b">
                          <h3 className="font-medium text-sm">Diagnostic Summary</h3>
                        </div>
                        <div className="p-4">
                          {authDebugData.sessionDebug?.isAuthenticated !== true && (
                            <Alert variant="destructive" className="mb-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Session Authentication Problem</AlertTitle>
                              <AlertDescription>
                                Your user session is not authenticated. Try logging in again.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {adminToken && authDebugData.sessionDebug?.isAuthenticated === true && (
                            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 mb-3">
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertTitle>Both Authentication Methods Available</AlertTitle>
                              <AlertDescription>
                                You have both session authentication and an admin token - this is optimal.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {!adminToken && authDebugData.sessionDebug?.isAuthenticated === true && (
                            <Alert className="mb-3 bg-amber-50 border-amber-200 text-amber-800">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Missing Admin Token</AlertTitle>
                              <AlertDescription>
                                You're logged in but don't have an admin token. Get a token from the admin-bypass page.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Response Data */}
              {responseStatus !== null && responseData && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Response</h3>
                    <Badge
                      className={responseStatus >= 200 && responseStatus < 300 ?
                        "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"}
                    >
                      Status: {responseStatus}
                    </Badge>
                  </div>
                  <div className="bg-slate-100 p-2 rounded text-xs font-mono h-40 overflow-auto">
                    <pre>{typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Debug Log Card */}
          <Card className="border-2 border-slate-200 md:col-span-2">
            <CardHeader className="bg-slate-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Debug Log
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDebugLog([]);
                    addLog('Debug log cleared');
                  }}
                >
                  Clear Log
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="p-3 text-xs font-mono bg-black text-green-400 overflow-auto h-80">
                {debugLog.length === 0 ? (
                  <div className="text-slate-500">No log entries yet. Use the debug tools above.</div>
                ) : (
                  debugLog.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}