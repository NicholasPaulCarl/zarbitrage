import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Mail,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function PaymentAnalyticsContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  const { 
    data: analytics, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/admin/payment-analytics'],
    queryFn: async () => {
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found');
      }

      const response = await fetch('/api/admin/payment-analytics', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics');
      }

      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
      case 'payment_completed':
        return 'bg-green-100 text-green-800';
      case 'payment_initiated':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'error':
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
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment analytics. Please check your admin permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const conversionRate = analytics?.totalUsers 
    ? ((analytics.activeSubscriptions / analytics.totalUsers) * 100).toFixed(1)
    : '0';

  const incompleteRate = analytics?.totalUsers
    ? ((analytics.incompletePayments / analytics.totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.incompletePayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {incompleteRate}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((analytics?.incompletePayments || 0) * 5).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From incomplete payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Registration Overview</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Funnel Analysis</CardTitle>
              <CardDescription>
                Track user progression through registration and payment stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <UserCheck className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{analytics?.registrationStats.registered || 0}</p>
                      <p className="text-sm text-gray-600">Users registered</p>
                    </div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CreditCard className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-600">{analytics?.registrationStats.paymentInitiated || 0}</p>
                      <p className="text-sm text-gray-600">
                        Payments initiated (
                        {analytics?.registrationStats.registered 
                          ? ((analytics.registrationStats.paymentInitiated / analytics.registrationStats.registered) * 100).toFixed(1)
                          : 0}%)
                      </p>
                    </div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Activity</CardTitle>
              <CardDescription>
                Latest payment attempts and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentPayments?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.username}</TableCell>
                        <TableCell>{payment.email}</TableCell>
                        <TableCell>
                          <Badge className={getStageColor(payment.stage)}>
                            {payment.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.provider}</TableCell>
                        <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent payments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomplete" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Users with Incomplete Payments</CardTitle>
              <CardDescription>
                Users who started but didn't complete their payment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.incompleteUsers?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registration Stage</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Payment Attempt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.incompleteUsers.map((user: any) => (
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
                          {user.lastPaymentAttempt ? formatDate(user.lastPaymentAttempt) : 'None'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No incomplete payments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}