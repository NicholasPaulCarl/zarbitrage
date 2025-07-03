import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation } from 'wouter';
import { 
  LogOut, 
  User, 
  Bell,
  HelpCircle,
  Settings,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  showDropdown?: boolean;
}

export default function UserMenu({ showDropdown = true }: UserMenuProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [location, setLocation] = useLocation();
  // Use consistent styling regardless of location
  const isMobile = false;

  if (!isAuthenticated) {
    return (
      <div className={cn(
        "flex items-center",
        isMobile ? "flex-col w-full gap-2" : "space-x-2"
      )}>
        <Button 
          variant="outline" 
          size={isMobile ? "default" : "sm"}
          className={isMobile ? "w-full" : ""}
          onClick={() => setLocation('/login')}
        >
          Log in
        </Button>
        <Button 
          size={isMobile ? "default" : "sm"}
          className={isMobile ? "w-full" : ""}
          onClick={() => setLocation('/register')}
        >
          Sign up
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const avatar = (
    <Button 
      variant="ghost" 
      size="sm"
      className={cn(
        "relative flex items-center gap-2 rounded-full",
        isMobile ? "w-full justify-between p-2" : "h-8 w-8 p-0"
      )}
    >
      <Avatar 
        className="h-8 w-8 border-2 border-primary/10 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          setLocation('/profile');
        }}
      >
        <AvatarImage 
          className="user-menu-avatar" 
          src={user?.profilePicture ? `${user.profilePicture}?t=${Date.now()}` : ""} 
          alt={user?.username} 
        />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {user?.username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {isMobile && (
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{user?.username}</span>
          <span className="text-xs text-gray-500">Account</span>
        </div>
      )}
    </Button>
  );

  if (!showDropdown) {
    return avatar;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "relative flex items-center gap-2 rounded-full",
            isMobile ? "w-full justify-between p-2" : "h-8 w-8 p-0"
          )}
        >
          <Avatar 
            className="h-8 w-8 border-2 border-primary/10 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              setLocation('/profile');
            }}
          >
            <AvatarImage 
              className="user-menu-avatar" 
              src={user?.profilePicture ? `${user.profilePicture}?t=${Date.now()}` : ""} 
              alt={user?.username} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isMobile && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs text-gray-500">Account</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => setLocation('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help</span>
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setLocation('/admin')}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="flex-1">Admin Dashboard</span>
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-md ml-2">
                Admin
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setLocation('/admin-login')}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span className="flex-1">Admin Login (JWT)</span>
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-md ml-2">
                Admin
              </span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}