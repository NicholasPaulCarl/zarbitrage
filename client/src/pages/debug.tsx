import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Debug page for development testing - only accessible in development mode
 */
export default function DebugPage() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isTesting, setIsTesting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirect to login if not in development mode
  if (import.meta.env.PROD) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[380px]">
          <CardHeader>
            <CardTitle>Debug Page</CardTitle>
            <CardDescription>This page is only accessible in development mode</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get all cookies for debugging
  const getCookiesInfo = () => {
    const cookies = document.cookie.split(';').reduce((acc, curr) => {
      const [key, value] = curr.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies;
  };
  
  // Test the admin API endpoint
  const testAdminEndpoint = async () => {
    setIsTesting(true);
    setApiResponse(null);
    setApiError(null);
    
    try {
      // First check current user
      console.log('Debug session - Testing auth status:');
      console.log('Current user:', user);
      console.log('Is authenticated:', isAuthenticated);
      console.log('Is admin:', isAdmin);
      console.log('Cookies:', getCookiesInfo());
      
      // Try to fetch admin users
      console.log('Fetching admin users...');
      const response = await fetch('/api/admin/users', {
        credentials: 'include', 
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      console.log('Admin API status:', response.status);
      console.log('Admin API headers:', 
        Object.fromEntries(response.headers.entries())
      );
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Status: ${response.status}, Message: ${text}`);
      }
      
      const data = await response.json();
      console.log('Admin API response data:', data);
      
      setApiResponse({
        apiData: data,
        authState: {
          user: user ? {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin
          } : null,
          isAuthenticated,
          isAdmin,
          cookies: getCookiesInfo()
        }
      });
    } catch (error) {
      console.error('Error testing admin endpoint:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };
  
  // Use the special admin bypass functionality for troubleshooting
  const adminBypass = async () => {
    setIsTesting(true);
    setApiResponse(null);
    setApiError(null);
    
    try {
      console.log('Attempting admin bypass login...');
      const response = await fetch('/api/auth/admin-bypass', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      console.log('Admin bypass response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Admin bypass error:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Admin bypass successful:', data);
      setApiResponse({
        message: 'Admin bypass successful! Redirecting to admin dashboard...',
        sessionId: data.sessionId,
        user: data.user
      });
      
      // Brief delay before redirect
      setTimeout(() => {
        // Force reload window to update auth state
        window.location.href = '/admin';
      }, 1500);
    } catch (error) {
      console.error('Admin bypass error:', error);
      setApiError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="grid gap-6">
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">Debug Page</CardTitle>
              <CardDescription className="text-amber-700">
                Development only authentication testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Authentication Status:</h3>
                <div className="bg-white p-3 rounded border">
                  <pre className="text-sm">
                    {JSON.stringify(
                      {
                        isAuthenticated,
                        isAdmin,
                        user: user ? {
                          id: user.id,
                          username: user.username,
                          email: user.email,
                          isAdmin: user.isAdmin,
                          subscriptionActive: user.subscriptionActive,
                        } : null
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={testAdminEndpoint}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Admin API'
                    )}
                  </Button>
                  
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={adminBypass}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Admin Bypass'
                    )}
                  </Button>
                  
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      setIsTesting(true);
                      try {
                        const response = await fetch('/api/auth/debug', {
                          credentials: 'include'
                        });
                        const data = await response.json();
                        setApiResponse({
                          title: "Current Session Data",
                          ...data
                        });
                      } catch (error) {
                        setApiError('Failed to get session: ' + (error instanceof Error ? error.message : String(error)));
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'View Session'
                    )}
                  </Button>
                  
                  {isAuthenticated && (
                    <Button 
                      variant="outline" 
                      onClick={() => logout()}
                      className="border-amber-300"
                    >
                      Logout
                    </Button>
                  )}
                  
                  {!isAuthenticated && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/login')}
                      className="border-amber-300"
                    >
                      Login
                    </Button>
                  )}
                </div>

                {apiResponse && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-700">API Response:</h3>
                    <div className="bg-white p-3 rounded border border-green-300">
                      <pre className="text-sm overflow-auto max-h-[300px]">
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {apiError && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-red-700">API Error:</h3>
                    <div className="bg-white p-3 rounded border border-red-300 text-red-700">
                      {apiError}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
                className="border-amber-300"
              >
                Back to Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/admin-bypass')}
                className="border-red-300 text-red-600"
              >
                Go to Admin Bypass
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}