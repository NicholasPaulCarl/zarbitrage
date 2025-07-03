import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

// Utility hook for admin API operations that use token-based authentication
export function useAdminApi() {
  const { toast } = useToast();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Verify admin token - works with both JWT and legacy formats
  const verifyAdminToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      if (!token) {
        console.log("useAdminApi - No token provided for verification");
        setIsVerifying(false);
        return false;
      }
      
      // Check if token is 'undefined' as a string (common error)
      if (token === 'undefined' || token.startsWith('undefined')) {
        console.log("useAdminApi - Token is 'undefined' string - clearing invalid token");
        localStorage.removeItem('adminToken');
        setIsVerifying(false);
        return false;
      }
      
      console.log("useAdminApi - Verifying token:", token.substring(0, 10) + "...");
      setIsVerifying(true);
      
      // For debugging: check if this is a JWT or legacy token
      if (token.includes('.') && token.split('.').length === 3) {
        // This is likely a JWT token (has 3 parts separated by dots)
        console.log("useAdminApi - Processing JWT token format");
        // Decode JWT token to check expiration (without verification)
        try {
          const parts = token.split('.');
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const expiry = new Date(payload.exp * 1000);
            const now = new Date();
            console.log("useAdminApi - JWT token expires:", expiry.toISOString());
            console.log("useAdminApi - Time until expiry:", 
              Math.max(0, (expiry.getTime() - now.getTime()) / 1000 / 60 / 60).toFixed(1) + " hours");
          }
        } catch (err) {
          console.error("useAdminApi - Error decoding JWT payload:", err);
          // Continue anyway as the server will properly verify it
        }
      } else {
        // Try to decode as legacy token
        try {
          const decodedToken = atob(token);
          const parts = decodedToken.split(':');
          
          if (parts.length === 5 && parts[0] === 'admin') {
            // New legacy token format with signature
            const expiryTime = parseInt(parts[3]);
            const now = Date.now();
            console.log("useAdminApi - Legacy token format with signature, expires in:", 
              Math.max(0, (expiryTime - now) / 1000 / 60 / 60).toFixed(1) + " hours");
          } 
          else if (parts.length === 3 && parts[0] === 'admin') {
            // Old legacy token format
            const timestamp = parseInt(parts[2]);
            const now = Date.now();
            const expiryTime = timestamp + (7 * 24 * 60 * 60 * 1000); // 7 days
            console.log("useAdminApi - Old legacy token format, expires in:", 
              Math.max(0, (expiryTime - now) / 1000 / 60 / 60).toFixed(1) + " hours");
          } else {
            console.log("useAdminApi - Unknown token format, parts:", parts.length);
          }
        } catch (err) {
          console.error("useAdminApi - Failed to decode legacy token:", err);
        }
      }
      
      // Store this token for future use
      setAdminToken(token);
      localStorage.setItem('adminToken', token);
      
      // Verify token with server using multiple methods for better compatibility
      const params = new URLSearchParams();
      params.append('token', token);
      
      const response = await fetch(`/api/auth/verify-admin-token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Admin-Token': token  // Also include as a custom header for backup
        },
        credentials: 'include' // Important: Include cookies in the request
      });
      
      // Get response data
      try {
        const responseData = await response.json();
        
        if (response.ok) {
          console.log("useAdminApi - Token verified for user:", responseData.user?.username);
          setAdminUser(responseData.user);
          setIsTokenValid(true);
          setIsVerifying(false);
          return true;
        }
        
        console.log("useAdminApi - Token verification failed:", responseData.message);
        
        // If token expired, clear it
        if (response.status === 401 && responseData.message?.includes("expired")) {
          console.log("useAdminApi - Token expired, clearing from localStorage");
          localStorage.removeItem('adminToken');
          setAdminToken(null);
        }
      } catch (parseError) {
        console.error("useAdminApi - Error parsing token verification response:", parseError);
        // If we couldn't parse the response, consider it a server error, not a token issue
        if (response.status === 200) {
          console.log("useAdminApi - Server returned success but with invalid JSON");
          // Still consider valid if status is 200, just couldn't parse it
          setIsTokenValid(true);
          setIsVerifying(false);
          return true;
        }
      }
      
      setIsTokenValid(false);
      setIsVerifying(false);
      return false;
    } catch (error) {
      console.error("useAdminApi - Error verifying admin token:", error);
      setIsVerifying(false);
      setIsTokenValid(false);
      return false;
    }
  }, []);
  
  // Check for token on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log("useAdminApi - Found token in localStorage:", token ? "YES" : "NO");
    
    // Check for invalid token stored as 'undefined'
    if (token === 'undefined' || token === 'null') {
      console.log("useAdminApi - Clearing invalid token from localStorage");
      localStorage.removeItem('adminToken');
      return;
    }
    
    if (token) {
      console.log("useAdminApi - Found token in localStorage, checking format");
      let validFormat = false;
      
      try {
        // First try our legacy token format (Base64 encoded string)
        const decodedToken = atob(token);
        const parts = decodedToken.split(':');
        
        // Check for legacy signature format (admin:userId:issuedAt:expiresAt:signature)
        if (parts.length === 5 && parts[0] === 'admin') {
          console.log("useAdminApi - Found valid legacy token format with signature");
          validFormat = true;
        } 
        // Check for old format (admin:userId:timestamp)
        else if (parts.length === 3 && parts[0] === 'admin') {
          console.log("useAdminApi - Found old legacy token format");
          validFormat = true;
        }
      } catch (e) {
        // If base64 decoding fails, might be a JWT token
        console.log("useAdminApi - Base64 decoding failed, checking if JWT format");
        
        // Check for JWT format
        if (token.includes('.') && token.split('.').length === 3) {
          console.log("useAdminApi - Found JWT token format");
          validFormat = true;
        }
      }
      
      if (validFormat) {
        // Use this token
        console.log("useAdminApi - Token format is valid, verifying with server");
        setAdminToken(token);
        
        // Verify token
        verifyAdminToken(token).then(valid => {
          setIsTokenValid(valid);
          if (!valid) {
            console.log("useAdminApi - Token verification failed");
            toast({
              title: "Admin token expired",
              description: "Please login again to get a new token",
              variant: "destructive",
            });
          } else {
            console.log("useAdminApi - Token verified successfully");
          }
        });
      } else {
        console.log("useAdminApi - Token format is invalid, clearing from localStorage");
        localStorage.removeItem('adminToken');
        setIsTokenValid(false);
      }
    } else {
      console.log("No admin token found in localStorage");
      
      // Try get token from session
      fetch('/api/auth/session-to-token', { 
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data?.token) {
            console.log("useAdminApi - Got token from session:", data.token.substring(0, 10) + "...");
            localStorage.setItem('adminToken', data.token);
            setAdminToken(data.token);
            verifyAdminToken(data.token);
          }
        })
        .catch(err => {
          console.error("Error getting token from session:", err);
        });
    }
  }, [toast, verifyAdminToken]);

  // Create headers with authorization for admin API requests
  const getAdminHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Only add token headers if we have a non-null token
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['X-Admin-Token'] = adminToken;
      headers['token'] = adminToken;
    }
    
    return headers;
  };

  // Get all users (admin)
  const useAdminUsers = () => {
    return useQuery({
      queryKey: ['/api/admin/users'],
      queryFn: async () => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        console.log("Fetching admin users with credentials");
        
        // Add token to query params as a fallback
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: getAdminHeaders(),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        console.log("Admin users response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log("Admin users API error:", JSON.stringify(errorData));
          throw new Error(errorData.message || "Failed to fetch users");
        }
        
        return await response.json();
      },
      enabled: !!adminToken && isTokenValid,
    });
  };

  // Get all feature requests (admin)
  const useAdminFeatureRequests = () => {
    return useQuery({
      queryKey: ['/api/admin/feature-requests'],
      queryFn: async () => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        console.log("Fetching admin feature requests with credentials");
        
        // Add token to query params as a fallback
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/feature-requests?${params.toString()}`, {
          headers: getAdminHeaders(),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        console.log("Admin feature requests response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log("Admin feature requests API error:", JSON.stringify(errorData));
          throw new Error(errorData.message || "Failed to fetch feature requests");
        }
        
        return await response.json();
      },
      enabled: !!adminToken && isTokenValid,
    });
  };

  // Update feature request status (admin)
  const useUpdateFeatureRequestMutation = () => {
    return useMutation({
      mutationFn: async ({ 
        id, 
        status, 
        adminNotes 
      }: { 
        id: number; 
        status: string; 
        adminNotes?: string;
      }) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/feature-requests/${id}?${params.toString()}`, {
          method: 'PATCH',
          headers: getAdminHeaders(),
          body: JSON.stringify({ status, adminNotes }),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        if (!response.ok) {
          // Try to get error details
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update feature request");
          } catch (err) {
            throw new Error("Failed to update feature request");
          }
        }
        
        return await response.json();
      },
      onSuccess: () => {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-requests'] });
        toast({
          title: "Success",
          description: "Feature request updated successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update feature request",
          variant: "destructive",
        });
      }
    });
  };

  // Set user admin status
  const useSetAdminStatusMutation = () => {
    return useMutation({
      mutationFn: async ({ 
        id, 
        isAdmin 
      }: { 
        id: number; 
        isAdmin: boolean;
      }) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/users/${id}/admin?${params.toString()}`, {
          method: 'PATCH',
          headers: getAdminHeaders(),
          body: JSON.stringify({ isAdmin }),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        if (!response.ok) {
          // Try to get error details
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update admin status");
          } catch (err) {
            throw new Error("Failed to update admin status");
          }
        }
        
        return await response.json();
      },
      onSuccess: () => {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        toast({
          title: "Success",
          description: "User admin status updated successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update admin status",
          variant: "destructive",
        });
      }
    });
  };

  // Activate user subscription
  const useActivateUserMutation = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/users/${id}/activate?${params.toString()}`, {
          method: 'PATCH',
          headers: getAdminHeaders(),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        if (!response.ok) {
          // Try to get error details
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to activate user");
          } catch (err) {
            throw new Error("Failed to activate user");
          }
        }
        
        return await response.json();
      },
      onSuccess: (data, variables) => {
        // Invalidate specific user data and all users list
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        
        // Force a refetch to ensure we have the latest data
        queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
        
        toast({
          title: "Success",
          description: "User subscription activated successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to activate user",
          variant: "destructive",
        });
      }
    });
  };

  // Deactivate user subscription
  const useDeactivateUserMutation = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/users/${id}/deactivate?${params.toString()}`, {
          method: 'PATCH',
          headers: getAdminHeaders(),
          credentials: 'include' // Important: Include cookies in the request
        });
        
        if (!response.ok) {
          // Try to get error details
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to deactivate user");
          } catch (err) {
            throw new Error("Failed to deactivate user");
          }
        }
        
        return await response.json();
      },
      onSuccess: (data, variables) => {
        // Invalidate specific user data and all users list
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        
        // Force a refetch to ensure we have the latest data
        queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
        
        toast({
          title: "Success",
          description: "User subscription deactivated successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to deactivate user",
          variant: "destructive",
        });
      }
    });
  };

  // Public method to verify token on demand (for AdminRoute component)
  const verifyToken = useCallback(async (): Promise<boolean> => {
    console.log("verifyToken - Starting token verification process");
    
    // Try JWT token first
    const jwtToken = localStorage.getItem('adminToken');
    if (jwtToken) {
      console.log("verifyToken - Found JWT token in localStorage");
      const isValid = await verifyAdminToken(jwtToken);
      if (isValid) {
        console.log("verifyToken - JWT token is valid");
        setIsTokenValid(true);
        return true;
      } else {
        console.log("verifyToken - JWT token is invalid, will try legacy token");
      }
    } else {
      console.log("verifyToken - No JWT token found in localStorage");
    }
    
    // Try legacy token as fallback
    const legacyToken = localStorage.getItem('adminAuthToken');
    if (legacyToken) {
      console.log("verifyToken - Found legacy token in localStorage");
      const isValid = await verifyAdminToken(legacyToken);
      if (isValid) {
        console.log("verifyToken - Legacy token is valid");
        // If valid, also save as the primary token
        localStorage.setItem('adminToken', legacyToken);
        setAdminToken(legacyToken);
        setIsTokenValid(true);
        return true;
      } else {
        console.log("verifyToken - Legacy token is invalid");
      }
    } else {
      console.log("verifyToken - No legacy token found in localStorage");
    }
    
    // If we get here, check if we already have a valid adminToken in state
    if (adminToken && isTokenValid) {
      console.log("verifyToken - Using existing valid token from state");
      return true;
    }
    
    // Try to get a token from cookie as a last resort
    try {
      console.log("verifyToken - Trying to get token from server-side session");
      const response = await fetch('/api/auth/session-to-token', {
        credentials: 'include' // Important for cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log("verifyToken - Successfully got token from session");
          // Save the token
          localStorage.setItem('adminToken', data.token);
          setAdminToken(data.token);
          setAdminUser(data.user);
          setIsTokenValid(true);
          return true;
        }
      }
    } catch (error) {
      console.error("verifyToken - Error getting token from session:", error);
    }
    
    // No valid token found
    console.log("verifyToken - No valid token found through any method");
    setIsTokenValid(false);
    return false;
  }, [verifyAdminToken, adminToken, isTokenValid]);

  // Get a specific user by ID (admin)
  const useAdminUserDetails = (userId: number) => {
    return useQuery({
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
          headers: getAdminHeaders(),
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
  };

  // Get deleted users (admin)
  const useDeletedUsers = () => {
    return useQuery({
      queryKey: ['/api/admin/users/deleted'],
      queryFn: async () => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params as a fallback
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        console.log("Fetching deleted users with credentials");
        const response = await fetch(`/api/admin/users/deleted?${params.toString()}`, {
          headers: getAdminHeaders(),
          credentials: 'include'
        });
        
        console.log("Deleted users response status:", response.status);
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Deleted users error:", errorData);
            throw new Error(errorData.message || "Failed to fetch deleted users");
          } catch (err) {
            console.error("Error parsing deleted users response:", err);
            throw new Error("Failed to fetch deleted users");
          }
        }
        
        const data = await response.json();
        console.log(`Retrieved ${data.length} deleted users`);
        return data;
      },
      enabled: !!adminToken && isTokenValid,
    });
  };

  // Get blacklisted emails (admin)
  const useBlacklistedEmails = () => {
    return useQuery({
      queryKey: ['/api/admin/blacklisted-emails'],
      queryFn: async () => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params as a fallback
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/blacklisted-emails?${params.toString()}`, {
          headers: getAdminHeaders(),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch blacklisted emails");
        }
        
        return await response.json();
      },
      enabled: !!adminToken && isTokenValid,
    });
  };

  // Delete user mutation (admin)
  const useDeleteUserMutation = () => {
    return useMutation({
      mutationFn: async (userId: number) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        const response = await fetch(`/api/admin/users/${userId}/delete?${params.toString()}`, {
          method: 'POST',
          headers: getAdminHeaders(),
          credentials: 'include'
        });
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete user");
          } catch (err) {
            throw new Error("Failed to delete user");
          }
        }
        
        return await response.json();
      },
      onSuccess: () => {
        toast({
          title: "User deleted",
          description: "User has been moved to the deleted users section",
        });
        
        // Force refresh of all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users/deleted'] });
        
        // Force an immediate refetch to ensure UI is updated
        queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
        queryClient.refetchQueries({ queryKey: ['/api/admin/users/deleted'] });
      },
      onError: (error) => {
        toast({
          title: "Failed to delete user",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Restore deleted user mutation (admin)
  const useRestoreUserMutation = () => {
    return useMutation({
      mutationFn: async (userId: number) => {
        if (!adminToken || !isTokenValid) {
          throw new Error("No valid admin token");
        }
        
        // Add token to query params for better compatibility
        const params = new URLSearchParams();
        params.append('token', adminToken);
        
        console.log(`Sending restore request for user ID: ${userId}`);
        
        const response = await fetch(`/api/admin/users/${userId}/restore?${params.toString()}`, {
          method: 'POST',
          headers: getAdminHeaders(),
          credentials: 'include'
        });
        
        console.log(`Restore user response status: ${response.status}`);
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Error restoring user:", errorData);
            throw new Error(errorData.message || "Failed to restore user");
          } catch (err) {
            throw new Error("Failed to restore user");
          }
        }
        
        return await response.json();
      },
      onSuccess: () => {
        toast({
          title: "User restored",
          description: "User has been restored and can now log in",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users/deleted'] });
      },
      onError: (error) => {
        toast({
          title: "Failed to restore user",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return {
    adminToken,
    isTokenValid,
    adminUser,
    isVerifying,
    verifyToken,
    verifyAdminToken,
    useAdminUsers,
    useAdminUserDetails,
    useAdminFeatureRequests,
    useUpdateFeatureRequestMutation,
    useSetAdminStatusMutation,
    useActivateUserMutation,
    useDeactivateUserMutation,
    useDeleteUserMutation,
    useRestoreUserMutation,
    useDeletedUsers,
    useBlacklistedEmails
  };
}