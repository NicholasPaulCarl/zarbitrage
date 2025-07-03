import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string | null;
  createdAt: string;
  subscriptionActive: boolean;
  subscriptionExpires?: string | null;
  isAdmin: boolean;
}

interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  requiresPayment: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  checkSubscription: (userId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check for admin token in localStorage
        const adminToken = localStorage.getItem('adminToken');
        
        if (adminToken) {
          try {
            // Verify admin token
            const verifyResponse = await fetch('/api/auth/verify-admin-token', {
              headers: {
                'Authorization': `Bearer ${adminToken}`
              }
            });
            
            if (verifyResponse.ok) {
              const adminData = await verifyResponse.json();
              console.log('Admin token verified, user data:', adminData);
              setUser(adminData.user);
              return;
            } else {
              console.log('Admin token invalid or expired');
              // If token is invalid, clear it
              localStorage.removeItem('adminToken');
            }
          } catch (tokenError) {
            console.error('Error verifying admin token:', tokenError);
          }
        }
        
        // If no valid admin token, try session auth
        try {
          const userData = await apiRequest<User>('/api/auth/user');
          if (userData) {
            setUser(userData);
          }
        } catch (sessionError) {
          // User is not authenticated via session, that's okay
          console.log('User not authenticated via session');
          setUser(null);
        }
      } catch (error) {
        // General error in authentication
        console.log('Authentication check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', { username });
      
      // This interface extends the User interface to include the auto-generated admin token
      interface LoginResponse extends User {
        adminToken?: {
          token: string;
          expires: string;
          expiresAt: number;
        }
      }
      
      const userData = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      console.log('Login successful, user data:', userData);
      
      // If user is admin and has admin token, store it
      if (userData.isAdmin && userData.adminToken?.token) {
        console.log('Admin token automatically generated on login, storing in localStorage');
        localStorage.setItem('adminToken', userData.adminToken.token);
      }
      
      setUser(userData);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to login',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await apiRequest<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      
      // If payment is not required, log in immediately
      if (!userData.requiresPayment) {
        // Immediately log in the user after successful registration
        await login(username, password);
        
        toast({
          title: 'Success',
          description: 'Account created successfully. You are now logged in.',
        });
      } else {
        toast({
          title: 'Account Created',
          description: 'Account created successfully. Payment required to activate.',
        });
      }
      
      return userData;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if a user's subscription is active
  const checkSubscription = async (userId: number) => {
    try {
      const response = await apiRequest<{active: boolean}>(`/api/subscription/${userId}`);
      return response.active;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear admin token if it exists
      localStorage.removeItem('adminToken');
      
      // Also attempt server-side logout (may fail if session is invalid)
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST'
        });
      } catch (error) {
        console.log('Session logout failed, but continuing with client-side logout');
      }

      // Clear cookies by setting expired cookie
      document.cookie = "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "adminAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(null);
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, we should still clear local state
      localStorage.removeItem('adminToken');
      setUser(null);
      
      toast({
        title: 'Warning',
        description: 'Logged out locally, but server logout may have failed',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        login,
        register,
        logout,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}