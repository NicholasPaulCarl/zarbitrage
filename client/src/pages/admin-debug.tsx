import React, { useState, useEffect } from 'react';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminDebug() {
  const { toast } = useToast();
  const { adminToken, isTokenValid, verifyToken } = useAdminApi();
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [userData, setUserData] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    // Check localStorage for existing token
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Automatically verify token when it changes
  useEffect(() => {
    if (token) {
      handleVerifyToken();
    }
  }, [token]);

  const handleGenerateToken = async () => {
    try {
      setStatus('loading');
      
      // Generate a new token
      const response = await fetch('/api/auth/generate-admin-token');
      
      if (!response.ok) {
        throw new Error(`Failed to generate token: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Generated admin token:", data);
      
      // Save token to state and localStorage
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
      
      // Update state with user data
      setUserData(data.user);
      setStatus('success');
      
      toast({
        title: "Admin token generated",
        description: `Token valid until ${new Date(data.expires).toLocaleString()}`,
      });
      
    } catch (error: any) {
      console.error('Error generating token:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to generate token');
    }
  };
  
  const handleVerifyToken = async () => {
    try {
      setStatus('loading');
      
      // Try to verify the token directly through API
      const params = new URLSearchParams();
      params.append('token', token);
      
      const response = await fetch(`/api/auth/verify-admin-token?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to verify token: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Verified token response:", data);
      
      // Update state with user data
      setUserData(data.user);
      setStatus('success');
      
      toast({
        title: "Admin token verified",
        description: "Token is valid and authenticated",
      });
      
    } catch (error: any) {
      console.error('Error verifying token:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to verify token');
    }
  };
  
  const handleTestAdminAPI = async () => {
    try {
      setLoadingUsers(true);
      
      // Add token to query params
      const params = new URLSearchParams();
      params.append('token', token);
      
      // Try to fetch admin users list
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admin users: ${response.status}`);
      }
      
      const users = await response.json();
      console.log("Admin users:", users);
      setAdminUsers(users);
      
      toast({
        title: "Admin API test successful",
        description: `Retrieved ${users.length} users`,
      });
      
    } catch (error: any) {
      console.error('Error testing admin API:', error);
      toast({
        title: "Admin API test failed",
        description: error.message || 'Failed to access admin API',
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Token Management</h1>
          <p className="text-muted-foreground">
            Generate, verify and test admin tokens for API access
          </p>
        </div>
        
        <AdminNavigation activeTab="debug">
          <div className="mt-6">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Authentication Debug</CardTitle>
                <CardDescription>Monitor and manage admin token verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Token Status:</p>
                    {isTokenValid ? (
                      <Badge className="bg-green-500">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </div>
                  
                  {status === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  {userData && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2">User Data:</h3>
                      <pre className="text-xs overflow-auto">{JSON.stringify(userData, null, 2)}</pre>
                    </div>
                  )}
                  
                  {adminUsers.length > 0 && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2">Admin Users List:</h3>
                      <p className="text-xs mb-2">Total users: {adminUsers.length}</p>
                      <div className="max-h-40 overflow-y-auto">
                        <pre className="text-xs">{JSON.stringify(adminUsers.slice(0, 3), null, 2)}</pre>
                        {adminUsers.length > 3 && <p className="text-xs text-muted-foreground">...and {adminUsers.length - 3} more</p>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={handleGenerateToken} 
                    disabled={status === 'loading'}
                    className="w-full"
                  >
                    {status === 'loading' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate New Token
                  </Button>
                  <Button 
                    onClick={handleVerifyToken} 
                    disabled={!token || status === 'loading'}
                    variant="outline"
                    className="w-full"
                  >
                    {status === 'loading' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Verify Token
                  </Button>
                </div>
                <Button 
                  onClick={handleTestAdminAPI} 
                  disabled={!isTokenValid || loadingUsers}
                  variant="secondary" 
                  className="w-full"
                >
                  {loadingUsers ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Test Admin API
                </Button>
              </CardFooter>
            </Card>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Token Value:</h3>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button 
                  onClick={() => {
                    localStorage.setItem('adminToken', token);
                    toast({
                      title: "Token Saved",
                      description: "The token has been saved to localStorage",
                    });
                  }}
                  variant="outline" 
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </AdminNavigation>
      </div>
    </Layout>
  );
}