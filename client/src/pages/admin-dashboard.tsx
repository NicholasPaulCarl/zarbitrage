import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check, Users, FileText, Bell, Settings, KeyRound, LogOut, Image, CreditCard } from "lucide-react";
import { useAdminApi } from "@/hooks/use-admin-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { User, FeatureRequest } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import PaymentAnalyticsContent from "@/components/PaymentAnalyticsContent";

export default function AdminDashboardPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const {
    adminToken,
    isTokenValid,
    adminUser,
    useAdminUsers,
    useAdminFeatureRequests,
    useUpdateFeatureRequestMutation,
    useSetAdminStatusMutation,
    useActivateUserMutation,
    useDeactivateUserMutation,
  } = useAdminApi();
  
  // Fetch users data
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsers();
  
  // Fetch feature requests data
  const {
    data: featureRequests,
    isLoading: featureRequestsLoading,
    error: featureRequestsError,
    refetch: refetchFeatureRequests,
  } = useAdminFeatureRequests();

  // Fetch carousels data
  const { data: carousels, isLoading: carouselsLoading, refetch: refetchCarousels } = useQuery({
    queryKey: ['/api/admin/carousels'],
    enabled: !!adminToken && isTokenValid,
  });

  // Check if admin token is valid
  useEffect(() => {
    if (!adminToken) {
      toast({
        title: "Admin Token Required",
        description: "You need an admin token to access this page",
        variant: "destructive",
      });
      setLocation("/admin-bypass");
    } else if (!isTokenValid) {
      toast({
        title: "Admin Token Invalid",
        description: "Your admin token is invalid or has expired",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/admin-bypass");
      }, 1500);
    }
  }, [adminToken, isTokenValid, adminUser, toast, setLocation]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
    setLocation("/admin-bypass");
  };

  if (!adminToken || !isTokenValid) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Access Required
              </CardTitle>
              <CardDescription>
                Admin token is required to access this page
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                onClick={() => setLocation("/admin-bypass")}
                className="w-full"
              >
                Get Admin Token
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4" />
              Admin access active
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Users</CardTitle>
              <CardDescription>User accounts on platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  users?.length || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feature Requests</CardTitle>
              <CardDescription>User suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {featureRequestsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  featureRequests?.length || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Homepage Carousels</CardTitle>
              <CardDescription>Active banners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {carouselsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  carousels?.length || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">System Status</CardTitle>
              <CardDescription>All systems operational</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-500" />
                <span className="text-sm text-green-600">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="feature-requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Feature Requests
            </TabsTrigger>
            <TabsTrigger value="carousels" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Homepage Carousels
            </TabsTrigger>
            <TabsTrigger value="payment-analytics" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : usersError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load users: {usersError instanceof Error ? usersError.message : 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {users?.length || 0} total users
                      </p>
                      <Button onClick={() => refetchUsers()} variant="outline" size="sm">
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {users?.slice(0, 10).map((user: User) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePicture || undefined} />
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.isAdmin && (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                            {user.subscriptionActive && (
                              <Badge variant="default">Premium</Badge>
                            )}
                            {user.isDeleted && (
                              <Badge variant="destructive">Deleted</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feature-requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Requests</CardTitle>
                <CardDescription>
                  Review and manage user feature suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {featureRequestsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : featureRequestsError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load feature requests: {featureRequestsError instanceof Error ? featureRequestsError.message : 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {featureRequests?.length || 0} total requests
                      </p>
                      <Button onClick={() => refetchFeatureRequests()} variant="outline" size="sm">
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {featureRequests?.slice(0, 10).map((request: FeatureRequest) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{request.title}</h4>
                            <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Created: {format(new Date(request.createdAt), 'PPP')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carousels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Homepage Carousels</CardTitle>
                <CardDescription>
                  Manage homepage banner content and display order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {carouselsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {carousels?.length || 0} total carousels
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => refetchCarousels()} variant="outline" size="sm">
                          Refresh
                        </Button>
                        <Button onClick={() => setLocation("/admin-carousel")} size="sm">
                          Manage Carousels
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {carousels?.slice(0, 5).map((carousel: any) => (
                        <div key={carousel.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{carousel.title}</h4>
                            <Badge variant={carousel.isActive ? 'default' : 'secondary'}>
                              {carousel.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {carousel.description}
                          </p>
                          {carousel.imageUrl && (
                            <div className="text-xs text-muted-foreground">
                              Image: {carousel.imageUrl}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>
                  Monitor payment flows and user conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentAnalyticsContent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}