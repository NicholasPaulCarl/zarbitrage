import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { paymentAnalyticsApi, PaymentAnalytics } from '@/lib/paymentAnalyticsApi';
import { paymentDebugger } from '@/lib/debugLogger';
import { 
  Users, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  Mail,
  Calendar,
  DollarSign,
  Bug,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AdminPaymentAnalyticsNew() {
  const { toast } = useToast();
  const { adminToken, isTokenValid, adminUser, isVerifying } = useAdminApi();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Initialize debugging
  useEffect(() => {
    paymentDebugger.info('AdminPaymentAnalytics', 'Component mounted', {
      hasAdminToken: !!adminToken,
      isTokenValid,
      adminUser: adminUser?.username
    });
  }, [adminToken, isTokenValid, adminUser]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!adminToken || !isTokenValid) {
      paymentDebugger.warn('AdminPaymentAnalytics', 'Cannot fetch - no valid token', {
        hasToken: !!adminToken,
        isValid: isTokenValid
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      paymentDebugger.info('AdminPaymentAnalytics', 'Starting API request');
      
      // First test connection
      const isConnected = await paymentAnalyticsApi.testConnection(adminToken);
      paymentDebugger.info('AdminPaymentAnalytics', 'Connection test result', { isConnected });
      
      if (!isConnected) {
        throw new Error('Unable to connect to backend API');
      }

      // Fetch analytics
      const data = await paymentAnalyticsApi.getPaymentAnalytics(adminToken);
      setAnalytics(data);
      
      paymentDebugger.info('AdminPaymentAnalytics', 'Analytics loaded successfully', {
        totalUsers: data.totalUsers,
        activeSubscriptions: data.activeSubscriptions
      });

      toast({
        title: "Analytics Updated",
        description: "Payment analytics data has been refreshed.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      paymentDebugger.error('AdminPaymentAnalytics', 'Failed to load analytics', { 
        error: errorMessage 
      });

      toast({
        title: "Error Loading Analytics",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount and when token becomes valid
  useEffect(() => {
    if (adminToken && isTokenValid && !isVerifying) {
      fetchAnalytics();
    }
  }, [adminToken, isTokenValid, isVerifying]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!analytics) return;
    
    const interval = setInterval(() => {
      if (adminToken && isTokenValid) {
        fetchAnalytics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [analytics, adminToken, isTokenValid]);

  // Show loading state
  if (isVerifying || (isLoading && !analytics)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment analytics...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !analytics) {
    return (
      <div className="p-6">
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-4">
          <Button onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
          
          <Button variant="outline" onClick={() => setDebugMode(!debugMode)}>
            <Bug className="h-4 w-4 mr-2" />
            {debugMode ? 'Hide' : 'Show'} Debug Info
          </Button>
        </div>

        {debugMode && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bug className="h-5 w-5 mr-2" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(paymentDebugger.getSummary(), null, 2)}
              </pre>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentDebugger.exportLogs());
                    toast({ title: "Debug logs copied to clipboard" });
                  }}
                >
                  Copy Debug Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show success state with analytics
  if (!analytics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No analytics data available. Please check your admin permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const conversionRate = analytics.totalUsers > 0 
    ? (analytics.activeSubscriptions / analytics.totalUsers * 100) 
    : 0;

  const incompletionRate = analytics.totalUsers > 0 
    ? (analytics.incompletePayments / analytics.totalUsers * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Analytics</h1>
          <p className="text-muted-foreground">Monitor user registration and payment completion</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDebugMode(!debugMode)}>
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>
          
          <Button onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success indicator */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Payment analytics loaded successfully! Data is live from your database.
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.incompletePayments}</div>
            <p className="text-xs text-muted-foreground">
              {incompletionRate.toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">{analytics.registrationStats.registered}</span> registered
              </div>
              <div className="text-sm">
                <span className="font-medium">{analytics.registrationStats.paymentInitiated}</span> started payment
              </div>
              <div className="text-sm">
                <span className="font-medium">{analytics.registrationStats.paymentCompleted}</span> completed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="incomplete" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incomplete">Incomplete Users</TabsTrigger>
          <TabsTrigger value="recent">Recent Payments</TabsTrigger>
          <TabsTrigger value="funnel">Registration Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="incomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users with Incomplete Payments</CardTitle>
              <CardDescription>
                {analytics.incompleteUsers?.length || 0} users need follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.incompleteUsers?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    🎉 No incomplete payments! All users have completed registration.
                  </p>
                ) : (
                  analytics.incompleteUsers?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{user.registrationStage}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Activity</CardTitle>
              <CardDescription>
                Latest payment attempts and completions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentPayments?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent payment activity
                  </p>
                ) : (
                  analytics.recentPayments?.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{payment.username}</div>
                        <div className="text-sm text-muted-foreground">{payment.email}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={payment.stage === 'completed' ? 'default' : 'secondary'}>
                            {payment.stage}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {payment.provider} • ${payment.amount}
                          </span>
                        </div>
                        {payment.errorMessage && (
                          <div className="text-xs text-red-600">{payment.errorMessage}</div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Conversion Funnel</CardTitle>
              <CardDescription>Track user progress through the registration process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Users Registered</span>
                    <span className="font-bold">{analytics.registrationStats.registered}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Payment Initiated</span>
                    <span className="font-bold">{analytics.registrationStats.paymentInitiated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.registrationStats.registered > 0 
                          ? (analytics.registrationStats.paymentInitiated / analytics.registrationStats.registered * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Payment Completed</span>
                    <span className="font-bold">{analytics.registrationStats.paymentCompleted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics.registrationStats.registered > 0 
                          ? (analytics.registrationStats.paymentCompleted / analytics.registrationStats.registered * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Panel */}
      {debugMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">API Debug Info</h4>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(paymentAnalyticsApi.getDebugInfo(), null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentDebugger.exportLogs());
                    toast({ title: "Debug logs copied to clipboard" });
                  }}
                >
                  Copy Logs
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    paymentDebugger.clear();
                    toast({ title: "Debug logs cleared" });
                  }}
                >
                  Clear Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}