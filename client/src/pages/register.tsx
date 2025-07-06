import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useTheme } from '@/components/dark-ui';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PaymentFlow from '@/components/PaymentFlow';

const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20, { message: 'Username must be less than 20 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' })
    .transform(val => val.toLowerCase()), // Normalize to lowercase
  email: z.string()
    .email({ message: 'Please enter a valid email address.' })
    .min(1, { message: 'Email is required.' }),
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters.' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z\d])/, { message: 'Password must contain at least one lowercase letter and one uppercase letter or number.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{id: number, email: string} | null>(null);
  const { register, login } = useAuth();
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setIsSubmitting(true);
      const userData = await register(values.username, values.email, values.password);
      
      if (userData.requiresPayment) {
        // Store the user data for payment flow
        setRegisteredUser({
          id: userData.id,
          email: values.email
        });
        
        // Show payment flow
        setShowPaymentFlow(true);
      } else {
        // If payment not required, user is already logged in by the register function
        setLocation('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle payment completion
  const handlePaymentComplete = async () => {
    try {
      // After payment completes, log the user in
      if (registeredUser) {
        const { username, password } = form.getValues();
        await login(username, password);
        
        // Redirect to home page
        setLocation('/');
      }
    } catch (error) {
      console.error('Error logging in after payment:', error);
    }
  }
  
  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setShowPaymentFlow(false);
  }

  return (
    <Layout headerOptions={{
      refreshRate: 30,
      setRefreshRate: () => {},
      refreshData: () => {},
      isLoading: false
    }}>
      <div className="flex items-center justify-center py-12">
        {showPaymentFlow && registeredUser ? (
          // Show payment flow when registration is complete but payment is required
          <PaymentFlow 
            userId={registeredUser.id}
            email={registeredUser.email}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        ) : (
          // Show registration form otherwise
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>
                Create your account for $5/month subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Subscription information */}
              <div className="mb-6 p-4 border rounded-md bg-secondary/20">
                <h3 className="font-medium mb-2">Subscription Information</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Access to premium features with a $5 monthly subscription:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Real-time arbitrage opportunities</li>
                  <li>Price alerts and notifications</li>
                  <li>Advanced trading calculators</li>
                  <li>Historical data and analytics</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">
                  Payment is processed securely through Bitcoin
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                          />
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
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="register-submit-button">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      'Register & Proceed to Payment'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-gray-500">
                Already have an account?
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
                  onClick={() => setLocation('/login')}
                >
                  Log in
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </Layout>
  );
}