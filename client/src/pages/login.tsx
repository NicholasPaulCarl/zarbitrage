import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useTheme } from '@/components/dark-ui';
import { Loader2, ShieldAlert } from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

// Debug component for development mode
function DevLoginHelper() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  
  const handleDevLogin = async (username: string, password: string) => {
    try {
      console.log(`Dev login attempt for ${username}`);
      
      // Try logging out first to clear any stale session
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        console.log('Cleared previous session before dev login:', await response.text());
      } catch (err) {
        console.log('Error clearing session:', err);
      }
      
      await login(username, password);
      
      console.log(`Dev login success for ${username}, delaying redirect`);
      toast({
        title: 'Dev Login Success',
        description: `Logged in as ${username}. Setting up session...`,
      });
      
      // Add a significant delay to ensure session is fully established
      setTimeout(() => {
        console.log('Session setup complete, redirecting to home');
        toast({
          title: 'Session Ready',
          description: 'Session established, redirecting...',
        });
        setLocation('/');
      }, 1500);
    } catch (error) {
      console.error('Dev login error:', error);
      toast({
        title: 'Dev Login Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Only show in development environment
  if (import.meta.env.DEV) {
    return (
      <div className="mt-6 p-4 border border-dashed rounded-md" style={{ borderColor: theme.colors.status.warning, backgroundColor: theme.colors.status.warning + '10' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" style={{ color: theme.colors.status.warning }} />
            <h3 className="text-sm font-semibold" style={{ color: theme.colors.status.warning }}>Development Mode - Test Accounts</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDevLogin('admin', 'admin123')}
              className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDevLogin('user', 'user123')}
              className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
            >
              Login as Regular User
            </Button>
          </div>
          <p className="text-xs text-amber-700">Quick login options for testing - only visible in development</p>
        </div>
      </div>
    );
  }
  
  return null;
}

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsSubmitting(true);
      console.log('Attempting login with:', { username: values.username });
      await login(values.username, values.password);
      
      // Add a significant delay to ensure session is fully established before redirecting
      // This prevents issues with admin authentication by giving the backend time
      // to complete session creation and storage
      console.log('Login successful, delaying redirect to ensure session persistence...');
      toast({
        title: 'Login Successful',
        description: 'Setting up your session...',
      });
      
      setTimeout(() => {
        console.log('Session delay complete, redirecting...');
        setLocation('/');
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid username or password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout headerOptions={{
      refreshRate: 30,
      setRefreshRate: () => {},
      refreshData: () => {},
      isLoading: false
    }}>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" data-testid="username-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" data-testid="password-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                  data-testid="login-submit-button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-500">
              Don't have an account?
            </div>
            <div className="flex items-center justify-center gap-3 px-2">
              <Button 
                variant="outline" 
                size="default"
                className="w-2/5 px-4 py-2"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button 
                size="default"
                className="w-2/5 px-4 py-2"
                onClick={() => setLocation('/register')}
              >
                Sign up
              </Button>
            </div>
            
            {/* Development mode quick login options */}
            <DevLoginHelper />
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}