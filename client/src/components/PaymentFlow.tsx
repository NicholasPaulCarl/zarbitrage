import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Payment } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, RefreshCw, CreditCard, Bitcoin } from 'lucide-react';
import YocoPaymentFlow from './YocoPaymentFlow';

interface PaymentFlowProps {
  userId: number;
  email: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

export default function PaymentFlow({ userId, email, onPaymentComplete, onCancel }: PaymentFlowProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annually'>('monthly');
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    priceMonthlyCents: 500,
    priceAnnuallyCents: 4800,
    currency: 'USD'
  });
  const { toast } = useToast();

  // Fetch subscription settings and create payment when component mounts
  useEffect(() => {
    fetchSubscriptionSettings();
  }, []);

  // Fetch subscription settings from the server
  const fetchSubscriptionSettings = async () => {
    try {
      const response = await apiRequest('/api/subscription-settings');
      setSubscriptionSettings({
        priceMonthlyCents: response.priceMonthlyCents,
        priceAnnuallyCents: response.priceAnnuallyCents,
        currency: response.currency
      });
      // Set default billing frequency from settings
      setBillingFrequency(response.defaultBillingFrequency === 'annually' ? 'annually' : 'monthly');
    } catch (error) {
      console.error('Error fetching subscription settings:', error);
      // Keep default values if fetch fails
    }
    // Create payment after settings are loaded
    createPayment();
  };

  // Create a payment for the user
  const createPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest<Payment>('/api/payment/create', {
        method: 'POST',
        body: JSON.stringify({ 
          userId, 
          email, 
          billingFrequency 
        }),
      });
      
      setPayment(response);
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Failed to create payment. Please try again.');
      toast({
        title: 'Payment Error',
        description: 'Failed to create payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the current price based on billing frequency
  const getCurrentPrice = () => {
    return billingFrequency === 'annually' 
      ? subscriptionSettings.priceAnnuallyCents / 100
      : subscriptionSettings.priceMonthlyCents / 100;
  };

  // Get savings percentage for annual billing
  const getSavingsPercentage = () => {
    const monthlyTotal = subscriptionSettings.priceMonthlyCents * 12;
    const annualPrice = subscriptionSettings.priceAnnuallyCents;
    return Math.round(((monthlyTotal - annualPrice) / monthlyTotal) * 100);
  };

  // Handle billing frequency change and recreate payment
  const handleBillingFrequencyChange = async (frequency: 'monthly' | 'annually') => {
    setBillingFrequency(frequency);
    setPayment(null);
    setIsLoading(true);
    
    // Small delay to ensure state updates
    setTimeout(() => {
      createPayment();
    }, 100);
  };

  // Check if payment has been completed
  const checkPaymentStatus = async () => {
    try {
      setIsCheckingStatus(true);
      
      const response = await apiRequest<{ active: boolean }>(`/api/subscription/${userId}`);
      
      if (response.active) {
        toast({
          title: 'Payment Successful',
          description: 'Your subscription has been activated!',
        });
        onPaymentComplete();
      } else {
        toast({
          title: 'Payment Pending',
          description: 'Your payment has not been confirmed yet.',
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Use mock payment for testing when needed
  const createMockPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest<Payment>('/api/payment/mock', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      
      setPayment(response);
      
      // For mock payments, we'll manually activate the subscription
      try {
        await apiRequest('/api/subscription/activate', {
          method: 'POST',
          body: JSON.stringify({ 
            userId,
            paymentId: response.id
          }),
        });
        
        toast({
          title: 'Payment Successful',
          description: 'Your subscription has been activated!',
        });
        
        onPaymentComplete();
      } catch (activationError) {
        console.error('Error activating subscription:', activationError);
        toast({
          title: 'Activation Error',
          description: 'There was an error activating your subscription. Please try again.',
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Error creating mock payment:', error);
      setError('Failed to create mock payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Choose Your Plan</CardTitle>
        <CardDescription>
          Select your billing frequency and complete payment to activate your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p>Loading subscription options...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={createPayment}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Billing Frequency Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Select Billing Plan</h3>
              
              <div className="grid gap-3">
                {/* Monthly Option */}
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    billingFrequency === 'monthly' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleBillingFrequencyChange('monthly')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        billingFrequency === 'monthly' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {billingFrequency === 'monthly' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Monthly</p>
                        <p className="text-sm text-muted-foreground">Billed monthly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: subscriptionSettings.currency
                        }).format(subscriptionSettings.priceMonthlyCents / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                  </div>
                </div>

                {/* Annual Option */}
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    billingFrequency === 'annually' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleBillingFrequencyChange('annually')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        billingFrequency === 'annually' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {billingFrequency === 'annually' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Annual</p>
                        <p className="text-sm text-muted-foreground">
                          Billed yearly • Save {getSavingsPercentage()}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: subscriptionSettings.currency
                        }).format(subscriptionSettings.priceAnnuallyCents / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ({new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: subscriptionSettings.currency
                        }).format(subscriptionSettings.priceAnnuallyCents / 12 / 100)}/month)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {payment && (
              <div className="text-center space-y-4">
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">
                    Total: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: subscriptionSettings.currency
                    }).format(getCurrentPrice())}{' '}
                    {subscriptionSettings.currency}
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Pay with card to activate your subscription instantly
                    </p>
                    
                    <div className="border rounded-md p-4 text-left text-sm space-y-2 mb-4">
                      <p className="font-medium">Secure card payment:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Payment processed securely via Yoco</li>
                        <li>Your subscription activates immediately upon successful payment</li>
                        <li>Subscription renews {billingFrequency}</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-center">
                      <YocoPaymentFlow
                        onSuccess={checkPaymentStatus}
                        onCancel={() => {}}
                        buttonText="Pay with Card"
                        showDialog={true}
                        userId={userId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* For development testing only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-center mb-2 text-muted-foreground">
                  Development Testing Options
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={createMockPayment}
                    className="text-xs"
                  >
                    Simulate Payment Success
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        {payment && (
          <Button variant="default" onClick={checkPaymentStatus} disabled={isCheckingStatus}>
            {isCheckingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Payment
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}