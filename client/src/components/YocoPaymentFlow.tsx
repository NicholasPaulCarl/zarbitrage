import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface YocoPaymentFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  buttonText?: string;
  showDialog?: boolean;
  userId: number; // Add userId prop
}

export function YocoPaymentFlow({ 
  onSuccess, 
  onCancel, 
  buttonText = "Subscribe with Card", 
  showDialog = true,
  userId
}: YocoPaymentFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const createPayment = async () => {
    // We're not checking for user here since the PaymentFlow component
    // already handles authentication before rendering this component
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make direct request to the Yoco payment endpoint using the userId from props
      console.log(`Creating Yoco payment for user ID: ${userId}`);
      
      const response = await axios.post('/api/payment/yoco', { 
        userId: userId 
      });
      
      if (response.data.success) {
        const { payment } = response.data;
        setPaymentUrl(payment.paymentUrl);
        setQrCode(payment.qrCode);
        
        // If dialog mode is disabled, redirect directly to payment page
        if (!showDialog) {
          window.location.href = payment.paymentUrl;
        }
      } else {
        throw new Error(response.data.message || 'Failed to create payment');
      }
    } catch (err: any) {
      console.error('Payment creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create payment');
      
      toast({
        title: "Payment Error",
        description: err.response?.data?.message || err.message || 'Failed to create payment',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleButtonClick = () => {
    if (showDialog) {
      setDialogOpen(true);
      createPayment();
    } else {
      createPayment();
    }
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setPaymentUrl(null);
    setQrCode(null);
    setError(null);
    
    if (onCancel) {
      onCancel();
    }
  };
  
  const redirectToPayment = () => {
    if (paymentUrl) {
      // Open in a new tab to prevent losing app state
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <>
      <Button 
        onClick={handleButtonClick}
        disabled={isLoading}
        variant="default"
      >
        {isLoading && !dialogOpen ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          buttonText
        )}
      </Button>
      
      {showDialog && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                Secure payment processed by Yoco
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 mb-4 animate-spin" />
                  <p className="text-sm text-center text-muted-foreground">
                    Preparing your secure payment...
                  </p>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : paymentUrl ? (
                <div className="flex flex-col items-center">
                  {qrCode && (
                    <div className="mb-4 p-2 bg-white rounded-md">
                      <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <p className="text-sm text-center mb-4">
                    Scan the QR code or click below to complete your payment
                  </p>
                  <Button onClick={redirectToPayment} className="w-full">
                    Proceed to Payment
                  </Button>
                </div>
              ) : null}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2 sm:mt-0">
                Your payment is secure and processed by Yoco
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default YocoPaymentFlow;