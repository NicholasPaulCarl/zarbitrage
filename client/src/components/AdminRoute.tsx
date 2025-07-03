import { useAuth } from "@/contexts/AuthContext";
import { useAdminApi } from "@/hooks/use-admin-api";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useEffect, useState } from "react";
import Admin from "@/pages/admin";

export default function AdminRoute() {
  const { user, isLoading } = useAuth();
  const { adminToken, isTokenValid, verifyToken } = useAdminApi();
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check for admin status from all possible sources
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log("AdminRoute - Checking auth status");
      
      // Flag to track if any authentication method succeeds
      let adminAccessGranted = false;
      
      // Method 1: Check session authentication
      const hasSessionAuth = user && user.isAdmin;
      if (hasSessionAuth) {
        console.log("AdminRoute - Admin access via session authentication");
        adminAccessGranted = true;
      }
      
      // Method 2: Check localStorage tokens (JWT and legacy)
      const jwtToken = localStorage.getItem('adminToken');
      const legacyToken = localStorage.getItem('adminAuthToken');
      
      // Method 3: Check for browser cookie flags
      const hasAdminCookie = document.cookie.includes('adminAuthenticated=true');
      if (hasAdminCookie && !adminAccessGranted) {
        console.log("AdminRoute - Admin access via browser cookie");
        adminAccessGranted = true;
      }
      
      // If we have a token, verify it
      if (!adminAccessGranted && (jwtToken || legacyToken)) {
        try {
          console.log("AdminRoute - Verifying admin token...");
          
          // Try to directly verify any token in localStorage
          const tokenToVerify = jwtToken || legacyToken;
          if (tokenToVerify) {
            // Create a direct API call to verify the token
            try {
              // Add token to query params for better compatibility
              const params = new URLSearchParams();
              params.append('token', tokenToVerify);
              
              const verifyResponse = await fetch(`/api/auth/verify-admin-token?${params.toString()}`, {
                headers: {
                  'Authorization': `Bearer ${tokenToVerify}`,
                  'X-Admin-Token': tokenToVerify,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });
              
              if (verifyResponse.ok) {
                const data = await verifyResponse.json();
                console.log("Admin token verified, user data:", data);
                if (data.user && data.user.isAdmin) {
                  adminAccessGranted = true;
                }
              }
            } catch (directError) {
              console.error("Direct token verification error:", directError);
            }
          }
          
          // If direct verification failed, try hook method as backup
          if (!adminAccessGranted) {
            const tokenValid = await verifyToken();
            if (tokenValid) {
              console.log("AdminRoute - Valid admin token found and verified");
              adminAccessGranted = true;
            } else {
              console.log("AdminRoute - Token verification failed");
            }
          }
        } catch (error) {
          console.error("AdminRoute - Token verification error:", error);
        }
      }
      
      // Log all auth methods for debugging
      console.log("AdminRoute - Auth status summary:", {
        session: { isLoading, hasUser: !!user, isAdmin: user?.isAdmin },
        token: { 
          hasJwtToken: !!jwtToken, 
          hasLegacyToken: !!legacyToken, 
          isValid: isTokenValid 
        },
        cookie: { hasAdminCookie },
        adminAccessGranted
      });
      
      // Set final admin status 
      setIsAdmin(adminAccessGranted || isTokenValid);
      
      // Done checking
      setIsCheckingToken(false);
    };
    
    checkAdminStatus();
  }, [user, isLoading, isTokenValid, verifyToken]);
  
  // Show loading state while checking credentials
  if (isLoading || isCheckingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <span className="ml-2">Verifying admin credentials...</span>
      </div>
    );
  }

  // If admin access confirmed through any method, show admin page
  if (isAdmin) {
    console.log("AdminRoute - Access granted to admin area");
    return <Admin />;
  }
  
  // If no valid auth method is found, redirect to new dedicated admin login page
  console.log("AdminRoute - No valid admin credentials found");
  return <Redirect to="/admin-login" />;
}