import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Crown, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';

interface SubscriptionGuardProps {
  children: ReactNode;
  featureName?: string;
  redirectToPremium?: boolean;
}

export default function SubscriptionGuard({ 
  children, 
  featureName = 'premium feature',
  redirectToPremium = true 
}: SubscriptionGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Stage 1: User not logged in - redirect to registration/login
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
          <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center">Account Required</CardTitle>
              <CardDescription className="text-center">
                Please create an account or log in to access {featureName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Create your free account and then upgrade to premium to unlock:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center justify-center">
                  <span className="mr-2 bg-primary/10 text-primary rounded-full p-1">✓</span>
                  Real-time arbitrage alerts
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-2 bg-primary/10 text-primary rounded-full p-1">✓</span>
                  Advanced profit calculator
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-2 bg-primary/10 text-primary rounded-full p-1">✓</span>
                  Trade journal & analytics
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => setLocation('/register')}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                <Crown className="mr-2 h-4 w-4" />
                Create Account & Get Premium
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                Already have an account? Log In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  // Stage 2: User logged in but no active subscription
  if (user.subscriptionActive !== true) {
    // If redirectToPremium is enabled, redirect to premium page
    if (redirectToPremium) {
      setLocation('/premium');
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Redirecting to premium page...</p>
            </div>
          </div>
        </Layout>
      );
    }

    // Otherwise show inline subscription prompt
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
          <Card className="w-full max-w-md mx-auto shadow-md border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <div className="mx-auto bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-center text-amber-800">Premium Access Required</CardTitle>
              <CardDescription className="text-center text-amber-700">
                Hi {user.username}! {featureName} requires an active subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-amber-800">
                You have successfully created your account. Now activate your premium subscription to unlock:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center justify-center text-amber-700">
                  <span className="mr-2 bg-amber-200 text-amber-800 rounded-full p-1">✓</span>
                  Real-time arbitrage alerts
                </li>
                <li className="flex items-center justify-center text-amber-700">
                  <span className="mr-2 bg-amber-200 text-amber-800 rounded-full p-1">✓</span>
                  Advanced profit calculator
                </li>
                <li className="flex items-center justify-center text-amber-700">
                  <span className="mr-2 bg-amber-200 text-amber-800 rounded-full p-1">✓</span>
                  Trade journal & webhook alerts
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => setLocation('/premium')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="mr-2 h-4 w-4" />
                View Premium Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/profile')}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Activate Subscription
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  // User has active subscription - render the premium content
  return <>{children}</>;
}