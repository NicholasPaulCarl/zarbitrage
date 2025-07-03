import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminApi } from '@/hooks/use-admin-api';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import AdminNavigation from '@/components/AdminNavigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  User,
  UserCheck,
  UserX,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  RotateCw,
  Edit,
  Save,
  CreditCard,
  Trash,
  AlertCircle,
} from 'lucide-react';

// User interface definition
interface User {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
  createdAt: string;
  subscriptionActive: boolean;
  subscriptionExpires: string | null;
  subscriptionPaymentId: string | null;
  isAdmin: boolean;
}

export default function AdminUserDetails() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id);
  
  const { isAdmin: isCurrentUserAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Admin API hooks
  const { 
    adminToken, 
    isTokenValid,
    useSetAdminStatusMutation,
    useActivateUserMutation,
    useDeactivateUserMutation
  } = useAdminApi();
  
  // Fetch user details directly
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/users', userId],
    queryFn: async () => {
      if (!adminToken || !isTokenValid) {
        throw new Error("No valid admin token");
      }
      
      console.log(`Fetching details for user ID: ${userId}`);
      
      // Add token to query params as a fallback
      const params = new URLSearchParams();
      params.append('token', adminToken);
      
      const response = await fetch(`/api/admin/users/${userId}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log("Admin user details response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("Admin user details API error:", JSON.stringify(errorData));
        throw new Error(errorData.message || `Failed to fetch user with ID: ${userId}`);
      }
      
      return await response.json();
    },
    enabled: !!adminToken && isTokenValid && !!userId,
  });

  // Action mutations
  const setAdminStatusMutation = useSetAdminStatusMutation();
  const activateUserMutation = useActivateUserMutation();
  const deactivateUserMutation = useDeactivateUserMutation();
  
  // Handle navigation back to admin dashboard
  const handleBack = () => {
    setLocation('/admin');
  };
  
  // Redirect to admin page if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !isCurrentUserAdmin) {
      toast({
        title: "Unauthorized",
        description: "You must be an admin to view this page",
        variant: "destructive",
      });
      setLocation('/admin');
    }
  }, [authLoading, isCurrentUserAdmin, setLocation, toast]);
  
  // Handle actions
  const handleToggleAdmin = () => {
    if (!user) return;
    
    setAdminStatusMutation.mutate({ 
      id: user.id, 
      isAdmin: !user.isAdmin 
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `Admin status ${user.isAdmin ? 'removed from' : 'granted to'} ${user.username}`,
        });
        refetch();
      }
    });
  };
  
  const handleToggleSubscription = () => {
    if (!user) return;
    
    if (user.subscriptionActive) {
      deactivateUserMutation.mutate(user.id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Subscription deactivated for ${user.username}`,
          });
          refetch();
        }
      });
    } else {
      activateUserMutation.mutate(user.id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Subscription activated for ${user.username}`,
          });
          refetch();
        }
      });
    }
  };
  
  // Handle user deletion (future implementation)
  const handleDeleteUser = () => {
    toast({
      title: "Not Implemented",
      description: "User deletion functionality will be added in a future update",
    });
    setConfirmDelete(false);
  };
  
  // Loading state
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading user details...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (error || !user) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="mb-6 flex items-center">
            <Button variant="outline" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
            </Button>
            <h1 className="text-3xl font-bold">User Not Found</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>
                Unable to load user details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{(error as Error)?.message || "User not found"}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => refetch()}>
                <RotateCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="mb-6 flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* User summary card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Profile</CardTitle>
              <CardDescription>User information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                ) : (
                  <AvatarFallback>
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <h2 className="text-xl font-semibold mb-1">{user.username}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              
              <div className="w-full space-y-2">
                {user.isAdmin ? (
                  <Badge className="w-full justify-center">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-full justify-center">
                    <User className="mr-1 h-3 w-3" />
                    Regular User
                  </Badge>
                )}
                
                {user.subscriptionActive ? (
                  <Badge className="w-full bg-green-500 text-white justify-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Subscription Active
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="w-full justify-center">
                    <XCircle className="mr-1 h-3 w-3" />
                    Subscription Inactive
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button 
                onClick={handleToggleAdmin}
                variant={user.isAdmin ? "destructive" : "outline"}
                className="w-full"
                disabled={setAdminStatusMutation.isPending}
              >
                {setAdminStatusMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : user.isAdmin ? (
                  <ShieldOff className="mr-2 h-4 w-4" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                {user.isAdmin ? "Remove Admin Status" : "Grant Admin Status"}
              </Button>
              
              <Button 
                onClick={handleToggleSubscription}
                variant={user.subscriptionActive ? "destructive" : "default"}
                className="w-full"
                disabled={activateUserMutation.isPending || deactivateUserMutation.isPending}
              >
                {activateUserMutation.isPending || deactivateUserMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : user.subscriptionActive ? (
                  <UserX className="mr-2 h-4 w-4" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                {user.subscriptionActive ? "Deactivate Subscription" : "Activate Subscription"}
              </Button>
              
              <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive border-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {user.username}'s account? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
          
          {/* User details tab content */}
          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Account Details</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>
                      Personal and account details for {user.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-primary" />
                          <p>{user.username}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                        <div className="flex items-center">
                          <Key className="mr-2 h-4 w-4 text-primary" />
                          <p>{user.id}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-primary" />
                          <p>{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Account Created</h3>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-primary" />
                          <p>{new Date(user.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Profile Picture</h3>
                      <div className="flex items-center">
                        {user.profilePicture ? (
                          <div className="space-y-2">
                            <div className="w-32 h-32 rounded-md overflow-hidden">
                              <img 
                                src={user.profilePicture} 
                                alt={`${user.username}'s profile`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{user.profilePicture}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No profile picture set</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="mr-2">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button variant="secondary">
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                    <CardDescription>
                      Subscription status and payment information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-md border">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.subscriptionActive ? 'bg-green-100' : 'bg-red-100'}`}>
                          {user.subscriptionActive ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">Subscription Status</h3>
                          <p className={`text-sm ${user.subscriptionActive ? 'text-green-600' : 'text-red-600'}`}>
                            {user.subscriptionActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleToggleSubscription}>
                        {user.subscriptionActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payment Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Payment ID</h4>
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4 text-primary" />
                            <p>{user.subscriptionPaymentId || 'No payment record'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Expiration Date</h4>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-primary" />
                            <p>
                              {user.subscriptionExpires 
                                ? new Date(user.subscriptionExpires).toLocaleDateString() 
                                : 'No expiration date'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Extend Subscription
                    </Button>
                    <Button variant="default">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>
                      Recent user activity and feature usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Activity Tracking</h3>
                      <p className="text-muted-foreground max-w-md">
                        User activity tracking will be implemented in a future update. This will include login history, feature usage, and other user actions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}