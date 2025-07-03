import opennode from 'opennode';
import crypto from 'crypto';
import { Payment, Subscription } from '@shared/schema';
import { storage } from '../storage';
import QRCode from 'qrcode';

// OpenNode configuration
const OPENNODE_API_KEY = process.env.OPENNODE_API_KEY || '';
const SUBSCRIPTION_PRICE_USD = 5; // $5 per month

// Initialize OpenNode client
opennode.setCredentials(OPENNODE_API_KEY, 'live'); // 'live' or 'dev' environment

// Import OpenNode types from the package
import { OpenNodeCharge } from 'opennode/dist/types/v1';

/**
 * Create a new subscription payment charge
 * @param userId User ID for subscription
 * @param email User's email for notification
 * @param billingFrequency Billing frequency (monthly or annually)
 * @param amount Payment amount in USD
 * @returns Payment object with checkout URL
 */
export async function createSubscriptionCharge(userId: number, email: string, billingFrequency: string = 'monthly', amount: number = 5): Promise<Payment> {
  try {
    // Check if we have API key
    if (!OPENNODE_API_KEY || OPENNODE_API_KEY.trim() === '') {
      console.log('No OpenNode API key found - please set OPENNODE_API_KEY environment variable');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('OpenNode API key is required in production environment');
      } else {
        console.log('Using mock payment in development environment');
        return createMockPayment(userId);
      }
    }

    // Validate input parameters
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID provided');
    }
    
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address provided');
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create charge metadata
    const metadata = {
      userId: userId.toString(),
      email,
      subscriptionType: billingFrequency,
      timestamp: new Date().toISOString()
    };

    // Set app URL with fallback
    const appUrl = process.env.APP_URL || 
                  (process.env.NODE_ENV === 'production' 
                   ? 'https://crypto-arbitrage-tracker.replit.app' 
                   : 'http://localhost:3000');

    // Create charge with OpenNode
    const chargeOptions = {
      amount: amount,
      currency: 'USD',
      description: `${billingFrequency === 'annually' ? 'Annual' : 'Monthly'} Crypto Arbitrage Subscription`,
      callback_url: `${appUrl}/api/payment/webhook`,
      success_url: `${appUrl}/subscription/success`,
      auto_settle: false,
      ttl: 60 * 60, // 1 hour expiry
      customer_email: email,
      customer_name: `User ${userId}`,
      order_id: `subscription-${userId}-${Date.now()}`,
      metadata
    };

    try {
      console.log('Creating OpenNode charge with options:', JSON.stringify({
        ...chargeOptions,
        customer_email: '***@***' // Redact email in logs
      }));
      
      const charge = await opennode.createCharge(chargeOptions);
      
      // Type check the response
      if (!charge || typeof charge !== 'object') {
        throw new Error('Invalid response from OpenNode API');
      }
      
      // We need to type cast since the actual API response might have different fields
      // than what's in the type definition
      const chargeData = charge as any;
      
      if (!chargeData.id || !chargeData.address) {
        throw new Error('Incomplete charge data received from OpenNode');
      }
      
      // Generate QR code for Bitcoin payment (use the Bitcoin address if lightning isn't available)
      let qrValue = chargeData.address;
      if (chargeData.lightning_invoice && chargeData.lightning_invoice.payreq) {
        qrValue = chargeData.lightning_invoice.payreq;
      }
      
      let qrCodeDataUrl;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(qrValue);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Fallback to simple text if QR generation fails
        qrCodeDataUrl = '';
      }

      // Return formatted payment object
      return {
        id: chargeData.id,
        status: 'pending',
        amount: amount,
        currency: 'BTC',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentUrl: chargeData.hosted_checkout_url || chargeData.checkout_url,
        paymentAddress: chargeData.address,
        userId,
        qrCode: qrCodeDataUrl
      };
    } catch (apiError) {
      console.error('Error creating OpenNode charge:', apiError instanceof Error ? apiError.message : apiError);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Payment processing error - please try again later');
      } else {
        console.log('Falling back to mock payment in development environment');
        return createMockPayment(userId);
      }
    }
  } catch (error) {
    console.error('Error in createSubscriptionCharge:', error instanceof Error ? error.message : error);
    
    if (process.env.NODE_ENV === 'production') {
      throw error; // In production, propagate the error for proper handling
    } else {
      // In development, use mock data
      console.log('Falling back to mock payment due to unexpected error');
      return createMockPayment(userId);
    }
  }
}

/**
 * Handle OpenNode webhook events
 */
export function handleWebhookEvent(rawBody: string, signature?: string): { type: string; userId?: number } {
  try {
    // If signature is provided, verify it for security
    if (signature && OPENNODE_API_KEY) {
      try {
        // OpenNode uses HMAC SHA-256 for webhook signatures
        // This implementation is based on OpenNode's documentation
        const hmac = crypto.createHmac('sha256', OPENNODE_API_KEY);
        const calculatedSignature = hmac.update(rawBody).digest('hex');
        
        // Use constant-time comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
          Buffer.from(calculatedSignature, 'hex'),
          Buffer.from(signature, 'hex')
        );
        
        if (!isValid) {
          console.error('Invalid webhook signature - potential security risk');
          throw new Error('Invalid webhook signature');
        }
      } catch (signatureError) {
        console.error('Error verifying webhook signature:', signatureError);
        throw new Error('Webhook signature verification failed');
      }
    } else if (!signature && process.env.NODE_ENV === 'production') {
      // In production, we should require signatures for security
      console.error('Missing webhook signature in production environment');
      throw new Error('Missing webhook signature');
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Error parsing webhook JSON:', parseError);
      throw new Error('Invalid webhook data format');
    }
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid webhook payload structure');
    }
    
    const { status, id, metadata } = payload;
    
    if (!status || !id) {
      throw new Error('Missing required webhook fields');
    }
    
    // Extract userId from metadata
    const userId = metadata && metadata.userId ? parseInt(metadata.userId) : undefined;
    
    // Handle payment confirmation events
    if (status === 'paid' || status === 'confirmed') {
      if (userId) {
        // Activate user subscription
        activateUserSubscription(userId, id);
        return { type: status, userId };
      } else {
        console.error('Payment confirmed but no userId found in metadata');
      }
    }
    
    // Handle payment failure or expiration events
    if (status === 'expired' || status === 'invalid' || status === 'underpaid' || status === 'refunded') {
      return { type: status, userId };
    }
    
    return { type: status };
    
  } catch (error) {
    console.error('Error processing webhook:', error instanceof Error ? error.message : error);
    throw new Error('Invalid webhook data');
  }
}

/**
 * Activate a user's subscription after payment
 */
async function activateUserSubscription(userId: number, paymentId: string): Promise<void> {
  try {
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Update user subscription status
    await storage.updateUser(userId, {
      subscriptionActive: true,
      subscriptionExpires: expiresAt,
      subscriptionPaymentId: paymentId
    });
    
    console.log(`Subscription activated for user ${userId} until ${expiresAt}`);
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

/**
 * Check if a user's subscription is active
 */
export async function checkSubscriptionStatus(userId: number): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return false;
    }
    
    // Check if user has an active subscription that hasn't expired
    return user.subscriptionActive && 
      user.subscriptionExpires !== null && 
      new Date(user.subscriptionExpires) > new Date();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: number): Promise<Subscription | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.subscriptionActive || !user.subscriptionExpires) {
      return null;
    }
    
    return {
      userId: user.id,
      active: user.subscriptionActive,
      expiresAt: new Date(user.subscriptionExpires).toISOString(),
      paymentId: user.subscriptionPaymentId || '',
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
}

/**
 * Generate a payment mock for testing when API keys are not available
 */
export async function createMockPayment(userId: number): Promise<Payment> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Generate a real QR code for the mock Bitcoin address
  const mockAddress = '1AcVYm7M3kkJQH28FXAvyBFQzFRL6xPKu8';
  const qrCodeDataUrl = await QRCode.toDataURL(mockAddress);
  
  return {
    id: `mock-payment-${Date.now()}`,
    status: 'pending',
    amount: SUBSCRIPTION_PRICE_USD,
    currency: 'BTC',
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentUrl: 'https://example.com/payment',
    paymentAddress: mockAddress,
    userId: userId,
    qrCode: qrCodeDataUrl
  };
}

/**
 * Generate a payment mock for testing when API keys are not available
 * @deprecated This function is deprecated and will be removed in future versions.
 * Use createMockPayment() instead which provides a properly generated QR code.
 */
export function generateMockPayment(userId: number): Payment {
  console.warn(
    'WARNING: generateMockPayment() is deprecated and will be removed in a future release. ' +
    'Please use createMockPayment() instead.'
  );
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  return {
    id: `mock-payment-${Date.now()}`,
    status: 'pending',
    amount: SUBSCRIPTION_PRICE_USD,
    currency: 'BTC',
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentUrl: 'https://example.com/payment',
    paymentAddress: '1AcVYm7M3kkJQH28FXAvyBFQzFRL6xPKu8',
    userId: userId,
    // Hardcoded QR code is a security risk and doesn't match the payment address properly
    // This is why this function is deprecated
    qrCode: '' // Empty string - forcing users to migrate to the safer createMockPayment()
  };
}