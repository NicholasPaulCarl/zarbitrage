import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminApi } from "@/hooks/use-admin-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminTest() {
  const { adminToken, verifyToken, verifyAdminToken, isTokenValid, adminUser, isVerifying } = useAdminApi();
  const [token, setToken] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [featureRequests, setFeatureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{[key: string]: { status: string, message: string }}>({});
  const { toast } = useToast();

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const testVerifyToken = async () => {
    try {
      setTestResults(prev => ({
        ...prev,
        verifyToken: { status: 'pending', message: 'Testing token verification...' }
      }));
      
      // Try to verify the current token
      const isValid = await verifyToken();
      
      setTestResults(prev => ({
        ...prev,
        verifyToken: { 
          status: isValid ? 'success' : 'error', 
          message: isValid ? 'Token verified successfully' : 'Token verification failed' 
        }
      }));
      
      if (isValid) {
        toast({
          title: "Token is valid",
          description: "Admin token verified successfully",
        });
      } else {
        toast({
          title: "Token verification failed",
          description: "Please login again to get a new token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing token verification:", error);
      setTestResults(prev => ({
        ...prev,
        verifyToken: { status: 'error', message: 'Error testing token verification' }
      }));
    }
  };

  const testVerifyExplicitToken = async () => {
    if (!token) {
      toast({
        title: "No token provided",
        description: "Please enter a token to verify",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setTestResults(prev => ({
        ...prev,
        verifyExplicitToken: { status: 'pending', message: 'Testing explicit token verification...' }
      }));
      
      // Try to verify the provided token
      const isValid = await verifyAdminToken(token);
      
      setTestResults(prev => ({
        ...prev,
        verifyExplicitToken: { 
          status: isValid ? 'success' : 'error', 
          message: isValid ? 'Explicit token verified successfully' : 'Explicit token verification failed' 
        }
      }));
      
      if (isValid) {
        toast({
          title: "Token is valid",
          description: "Admin token verified successfully",
        });
        
        // Save valid token to localStorage
        localStorage.setItem('adminToken', token);
      } else {
        toast({
          title: "Token verification failed",
          description: "Please try a different token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing explicit token verification:", error);
      setTestResults(prev => ({
        ...prev,
        verifyExplicitToken: { status: 'error', message: 'Error testing explicit token verification' }
      }));
    }
  };

  const testFetchUsers = async () => {
    try {
      setLoading(true);
      setTestResults(prev => ({
        ...prev,
        fetchUsers: { status: 'pending', message: 'Testing users API...' }
      }));
      
      // Call admin users API
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminToken || token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important for cookies
      });
      
      // Log results
      console.log("Admin users API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data);
      
      setTestResults(prev => ({
        ...prev,
        fetchUsers: { 
          status: 'success', 
          message: `Successfully fetched ${data.length} users` 
        }
      }));
      
      toast({
        title: "Users fetched successfully",
        description: `Found ${data.length} users`,
      });
    } catch (error) {
      console.error("Error testing users API:", error);
      setTestResults(prev => ({
        ...prev,
        fetchUsers: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Error testing users API' 
        }
      }));
      
      toast({
        title: "Failed to fetch users",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testFetchFeatureRequests = async () => {
    try {
      setLoading(true);
      setTestResults(prev => ({
        ...prev,
        fetchFeatureRequests: { status: 'pending', message: 'Testing feature requests API...' }
      }));
      
      // Call admin feature requests API
      const response = await fetch('/api/admin/feature-requests', {
        headers: {
          'Authorization': `Bearer ${adminToken || token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important for cookies
      });
      
      // Log results
      console.log("Admin feature requests API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch feature requests");
      }
      
      const data = await response.json();
      setFeatureRequests(data);
      
      setTestResults(prev => ({
        ...prev,
        fetchFeatureRequests: { 
          status: 'success', 
          message: `Successfully fetched ${data.length} feature requests` 
        }
      }));
      
      toast({
        title: "Feature requests fetched successfully",
        description: `Found ${data.length} feature requests`,
      });
    } catch (error) {
      console.error("Error testing feature requests API:", error);
      setTestResults(prev => ({
        ...prev,
        fetchFeatureRequests: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Error testing feature requests API' 
        }
      }));
      
      toast({
        title: "Failed to fetch feature requests",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin API Test Page</CardTitle>
          <CardDescription>
            Use this page to test admin token authentication and API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="border rounded-md p-4 bg-muted/30">
            <h3 className="font-medium mb-2">Authentication Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Token Valid:</div>
              <div>{isTokenValid ? '✅ Valid' : '❌ Invalid'}</div>
              
              <div className="font-medium">Admin User:</div>
              <div>{adminUser ? `✅ ${adminUser.username} (ID: ${adminUser.id})` : '❌ None'}</div>
              
              <div className="font-medium">Verifying:</div>
              <div>{isVerifying ? '⏳ In progress...' : '✓ Complete'}</div>
            </div>
          </div>
          
          {/* Token Generation and Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="token">Admin Token</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/generate-admin-token');
                    if (!response.ok) {
                      throw new Error('Failed to generate token');
                    }
                    const data = await response.json();
                    setToken(data.tokens.jwt);
                    toast({
                      title: "Token generated",
                      description: "Admin token has been generated and added to the input field"
                    });
                  } catch (error) {
                    toast({
                      title: "Error generating token",
                      description: error instanceof Error ? error.message : "Unknown error",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Generate New Token
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input 
                id="token" 
                value={token} 
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter admin token to test" 
                className="flex-1"
              />
              <Button onClick={testVerifyExplicitToken} disabled={!token}>
                {testResults.verifyExplicitToken?.status === 'pending' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verify
              </Button>
            </div>
          </div>
          
          {/* Test Results */}
          {Object.entries(testResults).map(([key, result]) => (
            <Alert key={key} variant={
              result.status === 'success' ? 'default' : 
              result.status === 'error' ? 'destructive' : 
              undefined
            }>
              <AlertTitle>{key}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <div className="flex space-x-2 w-full">
            <Button 
              onClick={testVerifyToken} 
              className="flex-1"
              variant="outline"
              disabled={testResults.verifyToken?.status === 'pending'}
            >
              {testResults.verifyToken?.status === 'pending' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Test Token Verification
            </Button>
            <Button 
              onClick={testFetchUsers} 
              className="flex-1"
              disabled={loading || testResults.fetchUsers?.status === 'pending'}
            >
              {testResults.fetchUsers?.status === 'pending' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Test Users API
            </Button>
            <Button 
              onClick={testFetchFeatureRequests} 
              className="flex-1"
              disabled={loading || testResults.fetchFeatureRequests?.status === 'pending'}
            >
              {testResults.fetchFeatureRequests?.status === 'pending' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Test Feature Requests API
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Display Users */}
      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{user.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{user.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {user.isAdmin ? '✅' : '❌'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {user.isActive ? '✅' : '❌'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Display Feature Requests */}
      {featureRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Requests ({featureRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {featureRequests.map(request => (
                    <tr key={request.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{request.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{request.title}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{request.userId}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}