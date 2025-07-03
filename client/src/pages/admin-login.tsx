import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import QuickAdminLogin from '@/components/QuickAdminLogin';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyRound, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [_, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Redirect to admin dashboard if already logged in
  useEffect(() => {
    if (user?.isAdmin) {
      setLocation('/admin');
    }
  }, [user, setLocation]);
  
  return (
    <Layout>
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Login to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Quick Access
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <QuickAdminLogin />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-muted-foreground mt-2">
              This page is for administrator access only.
              <br />
              Use the quick login button for development and testing.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}