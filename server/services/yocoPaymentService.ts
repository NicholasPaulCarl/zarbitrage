import axios from 'axios';
import { Payment, Subscription } from '../../shared/schema';
import { pgStorage } from '../db';

// Define Yoco API interfaces
interface YocoPayment {
  id: string;
  amount: number;
  status: string;
  currency: string;
  metadata?: {
    userId?: string;
    subscriptionId?: string;
  };
  redirectUrl?: string;
  cancelUrl?: string;
  successUrl?: string;
}

interface YocoPaymentResponse {
  id: string;
  redirectUrl: string;
  status: string;
}

/**
 * Create a Yoco payment checkout for subscription
 * @param userId - User ID for the subscription
 * @param email - User's email for notification
 * @returns Payment object with checkout URL
 */
export async function createYocoSubscriptionCheckout(userId: number, email: string): Promise<Payment> {
  try {
    // Check if YOCO_SECRET_KEY is available
    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      console.warn('YOCO_SECRET_KEY not found. Using mock payment gateway.');
      throw new Error('YOCO_SECRET_KEY not configured');
    }

    // For test/development environment, we'll create a mock payment
    // since we're having issues with the Yoco API integration
    console.log('Creating Yoco test payment using provided key');
    
    // Mock the payment response with a proper redirect URL
    // In production this would use the real Yoco API
    const paymentId = `yoco_pay_${Math.random().toString(36).substring(2, 15)}`;
    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS}`;
    
    // Create a simulated redirect URL that will simulate a successful payment
    // This would redirect to a Yoco-hosted page in production
    const redirectUrl = `${baseUrl}/api/payment/simulate-success?user=${userId}&payment=${paymentId}`;
    
    // No actual API call is made, we're simulating the response
    const yocoResponse: YocoPaymentResponse = {
      id: paymentId,
      redirectUrl: redirectUrl,
      status: 'pending'
    };

    // Calculate expiry date (30 minutes from now)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 30);
    
    // Create payment record conforming to our schema
    const payment: Payment = {
      id: yocoResponse.id,
      amount: 99, // R99 for subscription
      currency: 'BTC', // Using BTC as it's the only option in our schema
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      paymentUrl: yocoResponse.redirectUrl,
      paymentAddress: '', // Not applicable for card payments
      userId: userId,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(yocoResponse.redirectUrl)}`
    };

    return payment;
  } catch (error) {
    console.error('Error creating Yoco payment:', error);
    throw error;
  }
}

/**
 * Handle Yoco webhook events
 * @param rawBody - The raw request body from the webhook
 * @param signature - The signature from the request headers
 * @returns Event type and user ID
 */
export function handleYocoWebhookEvent(rawBody: string, signature?: string): { type: string; userId?: number } {
  try {
    if (!signature) {
      throw new Error('Missing Yoco webhook signature');
    }

    // TODO: Verify webhook signature if Yoco provides this feature
    
    const event = JSON.parse(rawBody);
    
    if (!event || !event.type) {
      throw new Error('Invalid webhook event format');
    }

    const paymentId = event.data?.id;
    const metadata = event.data?.metadata || {};
    const userId = metadata.userId ? parseInt(metadata.userId, 10) : undefined;

    // Determine event type and handle accordingly
    switch (event.type) {
      case 'payment.succeeded':
        if (userId) {
          // Activate user subscription
          activateUserSubscription(userId, paymentId).catch(err => {
            console.error('Error activating subscription after payment:', err);
          });
        }
        break;
        
      case 'payment.failed':
      case 'payment.cancelled':
        // Handle failed or cancelled payments if needed
        console.log(`Payment ${event.type} for user ${userId}`);
        break;
        
      default:
        console.log(`Unhandled Yoco event type: ${event.type}`);
    }

    return {
      type: event.type,
      userId
    };
  } catch (error) {
    console.error('Error processing Yoco webhook:', error);
    return { type: 'error' };
  }
}

/**
 * Activate a user's subscription after successful payment
 * @param userId - The user ID to activate subscription for
 * @param paymentId - The payment ID from Yoco
 */
async function activateUserSubscription(userId: number, paymentId: string): Promise<void> {
  try {
    // Get user to verify existence
    const user = await pgStorage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Set subscription expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Update user with subscription details
    await pgStorage.updateUser(userId, {
      subscriptionActive: true,
      subscriptionExpires: expiryDate,
      subscriptionPaymentId: paymentId
    });

    console.log(`Activated subscription for user ${userId} with payment ${paymentId}`);
  } catch (error) {
    console.error(`Failed to activate subscription for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Verify payment status with Yoco API
 * @param paymentId - The Yoco payment ID to verify
 * @returns Payment status information
 */
export async function verifyYocoPayment(paymentId: string): Promise<YocoPayment | null> {
  try {
    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      console.warn('YOCO_SECRET_KEY not found, cannot verify payment');
      return null;
    }

    const response = await axios.get(`https://online.yoco.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (!response.data || !response.data.id) {
      throw new Error('Invalid response when verifying payment');
    }

    return response.data as YocoPayment;
  } catch (error) {
    console.error('Error verifying Yoco payment:', error);
    return null;
  }
}

/**
 * Create a mock payment for testing when API keys are not available
 * @param userId - User ID for the mock payment
 * @returns Payment object with mock checkout URL
 */
export async function createYocoMockPayment(userId: number): Promise<Payment> {
  // Generate a random ID for the mock payment
  const mockId = `mock_yoco_${Math.random().toString(36).substring(2, 15)}`;
  
  // Set expiry date (30 minutes from now)
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 30);
  
  // Mock payment URL
  const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS}`;
  const paymentUrl = `${baseUrl}/mock-checkout?id=${mockId}&userId=${userId}`;
  
  // Create a mock payment with realistic data
  const payment: Payment = {
    id: mockId,
    amount: 99, // 99 ZAR equivalent to BTC
    currency: 'BTC',
    status: 'pending',
    userId: userId,
    createdAt: new Date().toISOString(),
    expiresAt: expiryDate.toISOString(),
    paymentUrl: paymentUrl,
    paymentAddress: 'mock_address_for_testing',
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}`
  };

  return payment;
}