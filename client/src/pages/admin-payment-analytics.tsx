import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminRoute } from '@/components/AdminRouteWrapper';
import Layout from '@/components/Layout';
import AdminNavigation from '@/components/AdminNavigation';

interface PaymentAnalytics {
  totalUsers: number;
  activeSubscriptions: number;
  incompletePayments: number;
  registrationStats: {
    registered: number;
    paymentInitiated: number;
    paymentCompleted: number;
  };
  recentPayments: Array<{
    id: number;
    username: string;
    email: string;
    stage: string;
    provider: string;
    amount: number;
    createdAt: string;
    errorMessage?: string;
  }>;
  incompleteUsers: Array<{
    id: number;
    username: string;
    email: string;
    registrationStage: string;
    createdAt: string;
    lastPaymentAttempt?: string;
  }>;
}

export default function AdminPaymentAnalytics() {
  const { toast } = useToast();
  const { adminToken, isTokenValid, adminUser, isVerifying } = useAdminApi();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const { data: analytics, isLoading, error, refetch } = useQuery<PaymentAnalytics>({
    queryKey: ['/api/admin/payment-analytics'],
    enabled: !!adminToken && !!isTokenValid, // Only run when we have a valid token
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async () => {
      console.log("🔍 Making API request with admin token");
      // Use the backend server directly to bypass Vite dev server
      const response = await fetch(window.location.origin + '/api/admin/payment-analytics', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        }
      });
      
      console.log("📊 API Response Status:", response.status);
      console.log("📊 Response Headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log("📄 Raw Response (first 200 chars):", responseText.substring(0, 200));
      
      // Check if response is HTML (indicates routing issue)
      if (responseText.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error('Received HTML instead of JSON - API routing issue');
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log("✅ Payment Analytics Data Loaded:", data);
        return data;
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
    }
  });

  // Debug logging
  console.log("🔍 Payment Analytics Debug:", {
    isLoading,
    hasData: !!analytics,
    error: error?.message,
    adminToken: !!adminToken,
    isTokenValid
  });

  const handleContactUser = async (userId: number, email: string) => {
    try {
      // In a real implementation, this would send an email or notification
      toast({
        title: "Contact User",
        description: `Would contact ${email} about completing their payment. (Email service not configured)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to contact user",
        variant: "destructive"
      });
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'completed':
      case 'payment_completed':
        return 'bg-green-100 text-green-800';
      case 'initiated':
      case 'payment_initiated':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <AdminRoute>
        <Layout>
          <AdminNavigation activeTab="payments">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </AdminNavigation>
        </Layout>
      </AdminRoute>
    );
  }

  if (error) {
    return (
      <AdminRoute>
        <Layout>
          <AdminNavigation activeTab="payments">
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load payment analytics. Please check your admin permissions.
                </AlertDescription>
              </Alert>
            </div>
          </AdminNavigation>
        </Layout>
      </AdminRoute>
    );
  }

  const conversionRate = analytics?.totalUsers 
    ? ((analytics.activeSubscriptions / analytics.totalUsers) * 100).toFixed(1)
    : '0';

  const incompleteRate = analytics?.totalUsers
    ? ((analytics.incompletePayments / analytics.totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <AdminRoute>
      <Layout>
        <AdminNavigation activeTab="payments">
          <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Analytics</h1>
            <p className="text-gray-600">Monitor payment flows and user conversion rates</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.activeSubscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {conversionRate}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incomplete Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{analytics?.incompletePayments || 0}</div>
              <p className="text-xs text-muted-foreground">
                {incompleteRate}% abandonment rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registration Funnel</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Registered:</span>
                  <span>{analytics?.registrationStats.registered || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Started Payment:</span>
                  <span>{analytics?.registrationStats.paymentInitiated || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span>{analytics?.registrationStats.paymentCompleted || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="incomplete" className="space-y-4">
          <TabsList>
            <TabsTrigger value="incomplete">Incomplete Payments</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="funnel">Registration Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="incomplete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Users with Incomplete Payments
                </CardTitle>
                <CardDescription>
                  Users who started the payment process but didn't complete it
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.incompleteUsers && analytics.incompleteUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Last Attempt</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.incompleteUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getStageColor(user.registrationStage)}>
                              {user.registrationStage}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {user.lastPaymentAttempt ? formatDate(user.lastPaymentAttempt) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactUser(user.id, user.email)}
                              className="flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              Contact
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No incomplete payments found!</p>
                    <p className="text-sm">All users who started payment have completed it.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Recent Payment Activity
                </CardTitle>
                <CardDescription>
                  Latest payment attempts and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.recentPayments && analytics.recentPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.username}</TableCell>
                          <TableCell>{payment.email}</TableCell>
                          <TableCell className="capitalize">{payment.provider}</TableCell>
                          <TableCell>
                            {payment.amount ? `$${payment.amount}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStageColor(payment.stage)}>
                              {payment.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          <TableCell>
                            {payment.errorMessage ? (
                              <span className="text-red-600 text-sm">{payment.errorMessage}</span>
                            ) : (
                              <span className="text-green-600">✓</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>No recent payment activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registration Conversion Funnel</CardTitle>
                <CardDescription>
                  Track how users progress through the registration and payment process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Account Registration</p>
                        <p className="text-sm text-gray-600">Users who created accounts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{analytics?.registrationStats.registered || 0}</p>
                      <p className="text-sm text-gray-600">100%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Payment Initiated</p>
                        <p className="text-sm text-gray-600">Users who started payment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{analytics?.registrationStats.paymentInitiated || 0}</p>
                      <p className="text-sm text-gray-600">
                        {analytics?.registrationStats.registered 
                          ? ((analytics.registrationStats.paymentInitiated / analytics.registrationStats.registered) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Payment Completed</p>
                        <p className="text-sm text-gray-600">Users with active subscriptions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{analytics?.registrationStats.paymentCompleted || 0}</p>
                      <p className="text-sm text-gray-600">
                        {analytics?.registrationStats.registered 
                          ? ((analytics.registrationStats.paymentCompleted / analytics.registrationStats.registered) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </div>
        </AdminNavigation>
      </Layout>
    </AdminRoute>
  );
}