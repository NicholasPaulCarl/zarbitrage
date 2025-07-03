import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminApi } from '@/hooks/use-admin-api';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import AdminNavigation from '@/components/AdminNavigation';
import DeletedUsersList from '@/components/DeletedUsersList';
import PaymentAnalyticsContent from '@/components/PaymentAnalyticsContent';
import { 
  TabsContent, 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  User,
  UserPlus,
  MoreHorizontal,
  Info,
  Calendar,
  Mail,
  CheckCircle2,
  Loader2,
  Clock,
  RotateCcw,
  KeyRound,
  CreditCard,
  Trash,
  Trash2,
  Edit
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
  createdAt: string;
  subscriptionActive: boolean;
  subscriptionExpires: string | null;
  subscriptionPaymentId: string | null;
  isAdmin: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

interface BlacklistedEmail {
  id: number;
  email: string;
  userId: number;
  reason?: string;
  createdAt: string;
}

interface FeatureRequest {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNotes: string | null;
}

interface UserManagementProps {
  users?: User[];
  isLoading: boolean;
  error: any;
  setAdminStatusMutation: any;
  activateUserMutation: any;
  deactivateUserMutation: any;
  deleteUserMutation: any;
}

function UserManagement({
  users,
  isLoading,
  error,
  setAdminStatusMutation,
  activateUserMutation,
  deactivateUserMutation,
  deleteUserMutation
}: UserManagementProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Handle opening the delete confirmation dialog
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Close user details dialog after successful operations
  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetailsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <p className="text-destructive">Error loading users: {(error as Error).message}</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
          className="mt-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-0">
      
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table className="[&_tr]:border-0">
            <TableCaption>List of all registered users</TableCaption>
            <TableHeader>
              <TableRow className="border-0">
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: User) => (
                <TableRow key={user.id} className="border-0">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <Dialog 
                        open={selectedUser?.id === user.id && userDetailsOpen}
                        onOpenChange={(open) => {
                          if (open) {
                            setSelectedUser(user);
                            setUserDetailsOpen(true);
                          } else {
                            setUserDetailsOpen(false);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-medium"
                            onClick={() => setSelectedUser(user)}
                          >
                            {user.username}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>User Details: {user.username}</DialogTitle>
                            <DialogDescription>
                              View and manage user account information and settings
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                            {/* User summary card */}
                            <div className="md:col-span-1">
                              <div className="flex flex-col items-center text-center">
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
                              </div>

                              <div className="flex flex-col space-y-2 mt-4">
                                <Button 
                                  onClick={() => setAdminStatusMutation.mutate({ id: user.id, isAdmin: !user.isAdmin })}
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
                                  onClick={() => user.subscriptionActive ? 
                                    deactivateUserMutation.mutate(user.id) : 
                                    activateUserMutation.mutate(user.id)
                                  }
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
                              </div>
                            </div>

                            {/* User details */}
                            <div className="md:col-span-3">
                              <Tabs defaultValue="profile">
                                <TabsList className="mb-4">
                                  <TabsTrigger value="profile">Account Details</TabsTrigger>
                                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                                </TabsList>

                                <TabsContent value="profile">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                                        <div className="flex items-center">
                                          <KeyRound className="mr-2 h-4 w-4 text-primary" />
                                          <p>{user.id}</p>
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

                                    {user.profilePicture && (
                                      <div className="space-y-2 mt-4">
                                        <h3 className="text-sm font-medium text-muted-foreground">Profile Picture</h3>
                                        <div className="flex items-center">
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
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>

                                <TabsContent value="subscription">
                                  <div className="space-y-4">
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
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </div>

                          <DialogFooter className="mt-6">
                            <div className="flex w-full justify-between">
                              <Button 
                                variant="destructive" 
                                type="button"
                                onClick={() => {
                                  if (selectedUser) {
                                    deleteUserMutation.mutate(selectedUser.id, {
                                      onSuccess: () => {
                                        // Close the dialog after successful deletion
                                        setUserDetailsOpen(false);
                                      }
                                    });
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash className="mr-2 h-4 w-4" />
                                )}
                                Delete User
                              </Button>
                              <div>
                                <Button variant="outline" type="button" className="mr-2">
                                  Reset Password
                                </Button>
                                <Button>Save Changes</Button>
                              </div>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.subscriptionActive ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge>
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <User className="mr-1 h-3 w-3" />
                        User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Subscription actions */}
                        {user.subscriptionActive ? (
                          <DropdownMenuItem
                            onClick={() => deactivateUserMutation.mutate(user.id)}
                            disabled={deactivateUserMutation.isPending}
                            className="text-destructive"
                          >
                            {deactivateUserMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UserX className="mr-2 h-4 w-4" />
                            )}
                            Deactivate Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => activateUserMutation.mutate(user.id)}
                            disabled={activateUserMutation.isPending}
                            className="text-green-600"
                          >
                            {activateUserMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="mr-2 h-4 w-4" />
                            )}
                            Activate Account
                          </DropdownMenuItem>
                        )}

                        {/* Admin status actions */}
                        {user.isAdmin ? (
                          <DropdownMenuItem
                            onClick={() => setAdminStatusMutation.mutate({ id: user.id, isAdmin: false })}
                            disabled={setAdminStatusMutation.isPending}
                          >
                            {setAdminStatusMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldOff className="mr-2 h-4 w-4" />
                            )}
                            Remove Admin Status
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setAdminStatusMutation.mutate({ id: user.id, isAdmin: true })}
                            disabled={setAdminStatusMutation.isPending}
                          >
                            {setAdminStatusMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="mr-2 h-4 w-4" />
                            )}
                            Grant Admin Status
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Delete user action */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.username}'s account? 
                                This will move the account to the deleted users section and 
                                the email address can be reused for new accounts. 
                                This action can be reversed from the deleted users section.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                  deleteUserMutation.mutate(user.id);
                                  toast({
                                    title: "User deleted",
                                    description: `${user.username}'s account has been moved to the deleted users section.`,
                                  });
                                }}
                                disabled={deleteUserMutation.isPending}
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem>
                              <Info className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              This is a placeholder for user details
                            </div>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function FeatureRequestManagement() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { adminToken, isTokenValid, useAdminFeatureRequests, useUpdateFeatureRequestMutation } = useAdminApi();
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'completed' | 'rejected'>('pending');
  const [open, setOpen] = useState(false);

  // Use the admin API hook for fetching feature requests
  const {
    data: featureRequests,
    isLoading,
    error,
    refetch
  } = useAdminFeatureRequests();

  // Use the admin API hook for updating feature requests
  const updateFeatureRequestMutation = useUpdateFeatureRequestMutation();

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSelectedRequest(null);
      setAdminNotes('');
      setSelectedStatus('pending');
    }
  };

  const handleEditRequest = (request: FeatureRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setSelectedStatus(request.status);
    setOpen(true);
  };

  const handleUpdateRequest = () => {
    if (selectedRequest) {
      updateFeatureRequestMutation.mutate({
        id: selectedRequest.id,
        status: selectedStatus,
        adminNotes: adminNotes
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <p className="text-destructive">Error loading feature requests: {(error as Error).message}</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-requests'] })}
          className="mt-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Requests</CardTitle>
        <CardDescription>
          Manage feature requests submitted by users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableCaption>List of all feature requests</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureRequests?.map((request: FeatureRequest) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRequest(request)}
                    >
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[500px]" aria-describedby="feature-request-dialog-description">
            <DialogHeader>
              <DialogTitle>Update Feature Request</DialogTitle>
              <DialogDescription id="feature-request-dialog-description">
                Change the status and provide admin notes for this feature request.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <div className="p-2 border rounded-md bg-muted">
                  {selectedRequest?.title}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <div className="p-2 border rounded-md bg-muted h-24 overflow-auto">
                  {selectedRequest?.description}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('pending')}
                    type="button"
                    size="sm"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Button>
                  <Button
                    variant={selectedStatus === 'approved' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('approved')}
                    type="button"
                    size="sm"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approved
                  </Button>
                  <Button
                    variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('completed')}
                    type="button"
                    size="sm"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Button>
                  <Button
                    variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('rejected')}
                    type="button"
                    size="sm"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Rejected
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add admin notes about this feature request..."
                  className="h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRequest}
                disabled={updateFeatureRequestMutation.isPending}
              >
                {updateFeatureRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Create User Form Component
interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false,
    subscriptionActive: false
  });
  const { toast } = useToast();
  const adminToken = localStorage.getItem('adminToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!adminToken) {
        throw new Error("No admin token available");
      }

      const response = await fetch(`/api/admin/users?token=${encodeURIComponent(adminToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully!",
      });

      // Invalidate all admin users queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter username"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter password"
            required
            minLength={6}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isAdmin"
            checked={formData.isAdmin}
            onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="isAdmin">Grant admin privileges</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="subscriptionActive"
            checked={formData.subscriptionActive}
            onChange={(e) => setFormData(prev => ({ ...prev, subscriptionActive: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="subscriptionActive">Activate subscription</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create User'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [userTab, setUserTab] = useState("active");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  
  // Subscription settings state - centralized in a single object for better state management
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    priceMonthlyCents: 500, // $5.00
    priceAnnuallyCents: 4800, // $48.00
    currency: 'USD',
    defaultBillingFrequency: 'monthly'
  });
  
  // Get admin token for authentication
  const adminToken = localStorage.getItem('adminToken');
  
  // Fetch subscription settings from server
  const { 
    data: fetchedSettings, 
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['/api/admin/subscription-settings'],
    queryFn: async () => {
      // Check if we have an admin token
      if (!adminToken) {
        throw new Error("No admin token available");
      }
      
      // Use token for authentication
      const response = await fetch(`/api/admin/subscription-settings?token=${encodeURIComponent(adminToken)}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` 
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription settings');
      }
      
      const data = await response.json();
      // Update state when data is fetched
      if (data) {
        setSubscriptionSettings(data);
      }
      return data;
    }
  });
  
  // Update subscription settings mutation
  // Create a mutation for updating subscription settings
  // Use the toast hook for notifications
  const { toast } = useToast();

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: typeof subscriptionSettings) => {
      // Get the admin token from local storage
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/subscription-settings?token=${encodeURIComponent(adminToken || '')}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'X-Admin-Token': adminToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subscription settings updated successfully',
      });
      // Refetch to ensure we have the latest data
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subscription settings',
        variant: 'destructive'
      });
    }
  });

  // Admin API hooks
  const { 
    useAdminUsers, 
    useAdminFeatureRequests,
    useUpdateFeatureRequestMutation,
    useSetAdminStatusMutation,
    useActivateUserMutation,
    useDeactivateUserMutation,
    useDeleteUserMutation,
    useRestoreUserMutation,
    useDeletedUsers,
    useBlacklistedEmails,
  } = useAdminApi();

  // Purge deleted users mutation
  const purgeDeletedUsersMutation = useMutation({
    mutationFn: async () => {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token available');
      }

      const response = await fetch(`/api/admin/users/deleted/purge?token=${encodeURIComponent(adminToken)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to purge deleted users');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate deleted users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/deleted'] });
    },
  });

  // Purge individual user mutation
  const purgeIndividualUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token available');
      }

      const response = await fetch(`/api/admin/users/${userId}/purge?token=${encodeURIComponent(adminToken)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to permanently delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate deleted users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/deleted'] });
    },
  });

  // Active users query
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsers();

  // Deleted users query
  const {
    data: deletedUsers,
    isLoading: deletedUsersLoading,
    error: deletedUsersError,
    refetch: refetchDeletedUsers,
  } = useDeletedUsers();

  // Feature requests query
  const {
    data: featureRequests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useAdminFeatureRequests();

  // Mutations for user management
  const setAdminStatusMutation = useSetAdminStatusMutation();
  const activateUserMutation = useActivateUserMutation();
  const deactivateUserMutation = useDeactivateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const restoreUserMutation = useRestoreUserMutation();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      // Using setLocation provides instant navigation instead of a full page reload
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading authentication state...</span>
        </div>
      </Layout>
    );
  }

  // Return null to prevent content flash before redirect
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        {/* User Stats Cards at the top */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Users (24h)
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users ? users.filter((user: User) => {
                  const createdDate = new Date(user.createdAt);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                  const diffHours = diffTime / (1000 * 60 * 60);
                  return diffHours <= 24;
                }).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Users registered in the last 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users ? users.length : 0}</div>
              <p className="text-xs text-muted-foreground">
                Total registered users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users ? users.filter((user: User) => user.subscriptionActive).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with active subscriptions
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, subscriptions, and feature requests
          </p>
        </div>

        <AdminNavigation activeTab={activeTab}>
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader className="pb-6">
                <CardTitle>User Management</CardTitle>
                <CardDescription className="mb-6">
                  Manage user accounts, subscriptions, and admin access
                </CardDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-4">
                    <Tabs value={userTab} onValueChange={setUserTab} className="w-[300px]">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active" className="text-sm">
                          Active Users
                          {users && ` (${users.filter((user: User) => !user.isDeleted).length})`}
                        </TabsTrigger>
                        <TabsTrigger value="deleted" className="text-sm">
                          Deleted Users
                          {deletedUsers && ` (${deletedUsers.length})`}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    {/* Show Permanent Delete All button for deleted users tab */}
                    {userTab === "deleted" && deletedUsers && deletedUsers.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete All Permanently
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete All Users?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete all {deletedUsers.length} deleted users and remove their data from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => purgeDeletedUsersMutation.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  {/* Only show Create User button on Active Users tab */}
                  {userTab === "active" && (
                    <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 w-full sm:w-auto">
                          <UserPlus className="h-4 w-4" />
                          <span className="hidden xs:inline">Create User</span>
                          <span className="xs:hidden">Create</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] mx-4">
                        <DialogHeader>
                          <DialogTitle>Create New User</DialogTitle>
                          <DialogDescription>
                            Add a new user account to the system
                          </DialogDescription>
                        </DialogHeader>
                        <CreateUserForm 
                          onSuccess={() => setCreateUserOpen(false)}
                          onCancel={() => setCreateUserOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {userTab === "active" ? (
                  <UserManagement 
                    users={users} 
                    isLoading={usersLoading} 
                    error={usersError}
                    setAdminStatusMutation={setAdminStatusMutation}
                    activateUserMutation={activateUserMutation}
                    deactivateUserMutation={deactivateUserMutation}
                    deleteUserMutation={deleteUserMutation}
                  />
                ) : (
                  <DeletedUsersList 
                    deletedUsers={deletedUsers}
                    isLoading={deletedUsersLoading}
                    error={deletedUsersError}
                    restoreUserMutation={restoreUserMutation}
                    purgeDeletedUsersMutation={purgeDeletedUsersMutation}
                    purgeIndividualUserMutation={purgeIndividualUserMutation}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <PaymentAnalyticsContent />
          </TabsContent>
          <TabsContent value="features" className="mt-6">
            <FeatureRequestManagement />
          </TabsContent>
          <TabsContent value="subscription" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Settings</CardTitle>
                <CardDescription>
                  Manage pricing, billing frequency, and currency for user subscriptions
                </CardDescription>
              </CardHeader>
              {settingsLoading ? (
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading settings...</span>
                  </div>
                </CardContent>
              ) : settingsError ? (
                <CardContent>
                  <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                    <p>Error loading subscription settings. Please try again later.</p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pricing section */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                            <CardDescription>
                              Set subscription prices for different billing frequencies
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Monthly price input */}
                            <div className="space-y-2">
                              <Label htmlFor="priceMonthlyCents">Monthly Price ({subscriptionSettings.currency})</Label>
                              <div className="flex items-center">
                                <div className="relative rounded-md shadow-sm">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    {subscriptionSettings.currency === 'USD' && '$'}
                                    {subscriptionSettings.currency === 'ZAR' && 'R'}
                                    {subscriptionSettings.currency === 'EUR' && '€'}
                                    {subscriptionSettings.currency === 'GBP' && '£'}
                                  </div>
                                  <input
                                    type="number"
                                    id="priceMonthlyCents"
                                    className="pl-7 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="0.00"
                                    value={subscriptionSettings.priceMonthlyCents / 100}
                                    onChange={(e) => setSubscriptionSettings({
                                      ...subscriptionSettings,
                                      priceMonthlyCents: Math.round(parseFloat(e.target.value) * 100)
                                    })}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: subscriptionSettings.currency
                                  }).format(subscriptionSettings.priceMonthlyCents / 100)} per month
                                </span>
                              </div>
                            </div>



                            {/* Annual price input */}
                            <div className="space-y-2">
                              <Label htmlFor="priceAnnuallyCents">Annual Price ({subscriptionSettings.currency})</Label>
                              <div className="flex items-center">
                                <div className="relative rounded-md shadow-sm">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    {subscriptionSettings.currency === 'USD' && '$'}
                                    {subscriptionSettings.currency === 'ZAR' && 'R'}
                                    {subscriptionSettings.currency === 'EUR' && '€'}
                                    {subscriptionSettings.currency === 'GBP' && '£'}
                                  </div>
                                  <input
                                    type="number"
                                    id="priceAnnuallyCents"
                                    className="pl-7 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="0.00"
                                    value={subscriptionSettings.priceAnnuallyCents / 100}
                                    onChange={(e) => setSubscriptionSettings({
                                      ...subscriptionSettings,
                                      priceAnnuallyCents: Math.round(parseFloat(e.target.value) * 100)
                                    })}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: subscriptionSettings.currency
                                  }).format(subscriptionSettings.priceAnnuallyCents / 100)} per year
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Settings section */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>
                              Configure additional subscription settings
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Currency selector */}
                            <div className="space-y-2">
                              <Label htmlFor="currency">Currency</Label>
                              <select
                                id="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={subscriptionSettings.currency}
                                onChange={(e) => setSubscriptionSettings({
                                  ...subscriptionSettings,
                                  currency: e.target.value
                                })}
                              >
                                <option value="USD">USD - US Dollar</option>
                                <option value="ZAR">ZAR - South African Rand</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                              </select>
                            </div>

                            {/* Billing frequency selector */}
                            <div className="space-y-2">
                              <Label htmlFor="defaultBillingFrequency">Default Billing Frequency</Label>
                              <select
                                id="defaultBillingFrequency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={subscriptionSettings.defaultBillingFrequency}
                                onChange={(e) => setSubscriptionSettings({
                                  ...subscriptionSettings,
                                  defaultBillingFrequency: e.target.value
                                })}
                              >
                                <option value="monthly">Monthly</option>
                                <option value="annually">Annually</option>
                              </select>
                              <p className="text-sm text-muted-foreground mt-1">
                                This is the default billing frequency shown to users
                              </p>
                            </div>

                            {/* Summary card */}
                            <div className="pt-4">
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="space-y-2">
                                    <h3 className="font-medium">Summary</h3>
                                    <p className="text-sm">
                                      Monthly: {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: subscriptionSettings.currency
                                      }).format(subscriptionSettings.priceMonthlyCents / 100)} /month
                                    </p>

                                    <p className="text-sm">
                                      Annually: {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: subscriptionSettings.currency
                                      }).format(subscriptionSettings.priceAnnuallyCents / 100)} /year
                                      <span className="ml-1 text-xs text-muted-foreground">
                                        ({new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: subscriptionSettings.currency
                                        }).format(subscriptionSettings.priceAnnuallyCents / 12 / 100)}/month)
                                      </span>
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Reset to defaults
                        setSubscriptionSettings({
                          priceMonthlyCents: 500,
                          priceAnnuallyCents: 4800,
                          currency: 'USD',
                          defaultBillingFrequency: 'monthly'
                        });
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={() => updateSettingsMutation.mutate(subscriptionSettings)}
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          </TabsContent>
        </AdminNavigation>
      </div>
    </Layout>
  );
}