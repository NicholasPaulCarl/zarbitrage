import { useState } from 'react';
import type { User } from '../pages/admin';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2,
  RotateCcw, 
  Loader2, 
  Mail, 
  Calendar 
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DeletedUsersListProps {
  deletedUsers?: User[];
  isLoading: boolean;
  error: any;
  restoreUserMutation: any;
  purgeDeletedUsersMutation: any;
  purgeIndividualUserMutation: any;
}

export default function DeletedUsersList({
  deletedUsers,
  isLoading,
  error,
  restoreUserMutation,
  purgeDeletedUsersMutation,
  purgeIndividualUserMutation,
}: DeletedUsersListProps) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [purgeIndividualDialogOpen, setPurgeIndividualDialogOpen] = useState(false);
  
  // Handle opening the restore confirmation dialog
  const handleRestoreUser = (user: User) => {
    setSelectedUser(user);
    setRestoreDialogOpen(true);
  };

  // Handle opening the individual permanent delete confirmation dialog
  const handlePermanentDeleteUser = (user: User) => {
    setSelectedUser(user);
    setPurgeIndividualDialogOpen(true);
  };

  // Handle purging all deleted users
  const handlePurgeAllDeletedUsers = async () => {
    try {
      await purgeDeletedUsersMutation.mutateAsync();
      setPurgeDialogOpen(false);
      toast({
        title: "Success",
        description: "All deleted users have been permanently removed from the database.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to purge deleted users",
        variant: "destructive",
      });
    }
  };

  // Handle permanently deleting individual user
  const handlePurgeIndividualUser = async () => {
    if (!selectedUser) return;
    
    try {
      await purgeIndividualUserMutation.mutateAsync(selectedUser.id);
      setPurgeIndividualDialogOpen(false);
      toast({
        title: "User Permanently Deleted",
        description: `${selectedUser.username} has been permanently removed from the database.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to permanently delete user",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deleted users...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-destructive">
        <p>Error loading deleted users: {error.message}</p>
      </div>
    );
  }
  
  if (!deletedUsers || deletedUsers.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
        <p className="text-lg">No deleted users found.</p>
        <p className="text-sm mt-2">All user accounts are currently active.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Mobile-optimized layout */}
      <div className="block md:hidden space-y-4">
        {deletedUsers.map((user) => (
          <div key={user.id} className="bg-card rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                  ) : null}
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">
                  {user.deletedAt 
                    ? new Date(user.deletedAt).toLocaleDateString() 
                    : 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleRestoreUser(user)}
                disabled={restoreUserMutation.isPending && restoreUserMutation.variables === user.id}
              >
                {restoreUserMutation.isPending && restoreUserMutation.variables === user.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => handlePermanentDeleteUser(user)}
                disabled={purgeIndividualUserMutation.isPending && purgeIndividualUserMutation.variables === user.id}
              >
                {purgeIndividualUserMutation.isPending && purgeIndividualUserMutation.variables === user.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Forever
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block">
        <Table className="[&_tr]:border-0">
          <TableCaption>List of deleted user accounts</TableCaption>
          <TableHeader>
            <TableRow className="border-0">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden xl:table-cell">Deleted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletedUsers.map((user) => (
              <TableRow key={user.id} className="border-0">
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                      ) : null}
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{user.username}</div>
                      <div className="text-sm text-muted-foreground lg:hidden">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {user.deletedAt 
                        ? new Date(user.deletedAt).toLocaleDateString() 
                        : 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 xl:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreUser(user)}
                      disabled={restoreUserMutation.isPending && restoreUserMutation.variables === user.id}
                      className="px-2 xl:px-3"
                    >
                      {restoreUserMutation.isPending && restoreUserMutation.variables === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 xl:mr-2" />
                          <span className="hidden xl:inline">Restore</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDeleteUser(user)}
                      disabled={purgeIndividualUserMutation.isPending && purgeIndividualUserMutation.variables === user.id}
                      className="px-2 xl:px-3"
                    >
                      {purgeIndividualUserMutation.isPending && purgeIndividualUserMutation.variables === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 xl:mr-2" />
                          <span className="hidden xl:inline">Delete Forever</span>
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Restore user confirmation dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {selectedUser?.username}'s account? 
              This will make their account active again and they will be able to log in
              with their original credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  restoreUserMutation.mutate(selectedUser.id);
                  setRestoreDialogOpen(false);
                  toast({
                    title: "User Restored",
                    description: `${selectedUser.username}'s account has been restored and can now login again.`,
                  });
                }
              }}
              disabled={restoreUserMutation.isPending}
            >
              {restoreUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Restore"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Individual permanent delete confirmation dialog */}
      <AlertDialog open={purgeIndividualDialogOpen} onOpenChange={setPurgeIndividualDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedUser?.username}'s account? 
              <br /><br />
              <strong className="text-destructive">This action cannot be undone.</strong> The user data will be completely removed from the database and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeIndividualUser}
              disabled={purgeIndividualUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purgeIndividualUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Forever"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}