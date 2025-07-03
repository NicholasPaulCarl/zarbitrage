import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminApi } from '@/hooks/use-admin-api';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ClipboardList, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { FeatureRequest } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function FeatureRequestsPage() {
  const { isAuthenticated, user } = useAuth();
  const { adminToken, isTokenValid } = useAdminApi();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Wait a moment for authentication to be ready before enabling the query
  const [authReady, setAuthReady] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure authentication state is settled
    const timer = setTimeout(() => {
      setAuthReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch user's feature requests - with token authentication
  const {
    data: featureRequests,
    isLoading,
    error
  } = useQuery<FeatureRequest[]>({
    queryKey: ['/api/feature-requests'],
    queryFn: async () => {
      // Always check for token auth first, then session auth
      const hasValidToken = !!adminToken && isTokenValid;
      const hasSessionAuth = isAuthenticated;
      const hasAuth = hasValidToken || hasSessionAuth;
      
      console.log("Feature requests - Auth check:", {
        sessionAuth: hasSessionAuth,
        tokenAuth: hasValidToken,
        hasAuth,
        adminToken: adminToken ? adminToken.substring(0, 20) + '...' : null,
        isTokenValid
      });
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Always add token if available (admin users need this)
      if (hasValidToken && adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch('/api/feature-requests', {
        method: 'GET',
        headers: headers,
        credentials: 'include' // Include cookies for session auth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch feature requests");
      }
      
      return await response.json();
    },
    // Enable the query only after auth is ready and user has valid authentication
    enabled: authReady && (isAuthenticated || (!!adminToken && isTokenValid)),
    retry: 3, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Submit new feature request - with token authentication
  const submitFeatureRequestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      // Determine if we should use token-based auth
      const useTokenAuth = !!adminToken && isTokenValid;
      console.log("Feature request submit - Using token auth:", useTokenAuth);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add token to headers if available
      if (useTokenAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: headers,
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit feature request");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Clear form and refresh requests
      setTitle('');
      setDescription('');
      toast({
        title: 'Success',
        description: 'Your feature request has been submitted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feature-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feature request',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and description',
        variant: 'destructive',
      });
      return;
    }
    submitFeatureRequestMutation.mutate({ title, description });
  };

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
            <FileText className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Redirect to login if not authenticated (by session or token)
  const [, setLocation] = useLocation();
  const [authChecking, setAuthChecking] = useState(true);
  const [hasValidAuth, setHasValidAuth] = useState(false);
  
  // Add a direct API call test
  const [testApiStatus, setTestApiStatus] = useState("");
  
  // Test the API directly with the token
  const testApi = async () => {
    try {
      setTestApiStatus("Testing API...");
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch('/api/feature-requests', {
        headers: headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API test successful:", data);
        setTestApiStatus(`Success! Got ${data.length} feature requests`);
        return data;
      } else {
        const error = await response.json();
        console.error("API test failed:", error);
        setTestApiStatus(`Error: ${error.message}`);
        return null;
      }
    } catch (error) {
      console.error("API test exception:", error);
      setTestApiStatus(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };
  
  // When admin token is verified, try to test the API directly
  useEffect(() => {
    if (adminToken && isTokenValid) {
      console.log("Admin token is valid, testing API directly");
      testApi();
    }
  }, [adminToken, isTokenValid]);
  
  useEffect(() => {
    const tokenAuth = !!adminToken && isTokenValid;
    const hasAuth = isAuthenticated || tokenAuth;
    
    console.log("Feature requests - Auth check:", { 
      sessionAuth: isAuthenticated, 
      tokenAuth, 
      hasAuth,
      adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : null,
      isTokenValid
    });
    
    setHasValidAuth(hasAuth);
    setAuthChecking(isLoading || (!!adminToken && !isTokenValid));
    
    if (!authChecking && !hasAuth) {
      // Using setLocation instead of window.location.href for instant navigation
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, adminToken, isTokenValid, setLocation, authChecking]);
  
  if (authChecking) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </Layout>
    );
  }
  
  if (!hasValidAuth) {
    return null; // This prevents content flash before redirect
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feature Requests</h1>
        </div>
        
        {/* API test status */}
        {testApiStatus && (
          <div className={`p-4 mb-6 rounded-md ${testApiStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
            <p className="text-sm font-medium">API Test Status: {testApiStatus}</p>
            {!testApiStatus.includes('Success') && (
              <button
                onClick={testApi}
                className="mt-2 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md"
              >
                Retry API Test
              </button>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Feature Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit a Feature Request</CardTitle>
              <CardDescription>
                Tell us what you'd like to see in the platform
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="A brief title for your request"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the feature you'd like to see in detail..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitFeatureRequestMutation.isPending}
                >
                  {submitFeatureRequestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Your Feature Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                Your Requests
              </CardTitle>
              <CardDescription>
                Track the status of your feature requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-destructive/25 rounded-lg bg-destructive/5">
                  <XCircle className="h-12 w-12 text-destructive/70 mb-2" />
                  <h3 className="text-lg font-medium mb-1 text-destructive/80">Unable to load requests</h3>
                  <p className="text-muted-foreground mb-4 max-w-xs">
                    There was a problem loading your feature requests. You can still submit a new request.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/feature-requests'] })}
                  >
                    Try Again
                  </Button>
                </div>
              ) : featureRequests && featureRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureRequests.map((request) => (
                      <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {request.title}
                          {request.adminNotes && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              <strong>Admin Note:</strong> {request.adminNotes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(request.createdAt)}</TableCell>
                        <TableCell>{renderStatusBadge(request.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/70 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No feature requests yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-xs">
                    Share your ideas on how we can improve the platform by submitting a feature request
                  </p>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => document.getElementById('title')?.focus()}
                    >
                      <Send className="h-4 w-4" />
                      Suggest a feature
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}