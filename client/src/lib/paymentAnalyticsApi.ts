/**
 * Dedicated Payment Analytics API Service
 * This handles all API communication for payment analytics with comprehensive debugging
 */

import { paymentDebugger } from './debugLogger';

export interface PaymentAnalytics {
  totalUsers: number;
  activeSubscriptions: number;
  incompletePayments: number;
  registrationStats: {
    registered: number;
    paymentInitiated: number;
    paymentCompleted: number;
  };
  recentPayments: Array<{
    id: number;
    username: string;
    email: string;
    stage: string;
    provider: string;
    amount: number;
    createdAt: string;
    errorMessage?: string;
  }>;
  incompleteUsers: Array<{
    id: number;
    username: string;
    email: string;
    registrationStage: string;
    createdAt: string;
    lastPaymentAttempt?: string;
  }>;
}

class PaymentAnalyticsApiService {
  private baseUrl: string;

  constructor() {
    // Determine the correct base URL for API calls
    this.baseUrl = this.determineBaseUrl();
    paymentDebugger.info('PaymentAnalyticsApi', 'Service initialized', { baseUrl: this.baseUrl });
  }

  private determineBaseUrl(): string {
    // In development, we need to ensure we hit the Express server directly
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
      // Use the same origin but ensure we hit the backend
      return window.location.origin;
    }
    return '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    paymentDebugger.debug('PaymentAnalyticsApi', 'Making request', {
      url,
      method: options.method || 'GET',
      headers: options.headers
    });

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      paymentDebugger.debug('PaymentAnalyticsApi', 'Response received', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      return response;
    } catch (error) {
      paymentDebugger.error('PaymentAnalyticsApi', 'Request failed', { 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async getPaymentAnalytics(adminToken: string): Promise<PaymentAnalytics> {
    paymentDebugger.info('PaymentAnalyticsApi', 'Fetching payment analytics', { 
      hasToken: !!adminToken,
      tokenLength: adminToken?.length 
    });

    try {
      const response = await this.makeRequest('/api/admin/payment-analytics', {
        method: 'GET',
        headers: {
          'x-admin-token': adminToken,
        },
      });

      // Check if we got HTML instead of JSON (common routing issue)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        paymentDebugger.error('PaymentAnalyticsApi', 'Received HTML instead of JSON', {
          contentType,
          status: response.status,
          url: response.url
        });
        throw new Error('API routing issue: received HTML instead of JSON');
      }

      if (!response.ok) {
        const errorText = await response.text();
        paymentDebugger.error('PaymentAnalyticsApi', 'HTTP error response', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      paymentDebugger.debug('PaymentAnalyticsApi', 'Raw response received', {
        length: responseText.length,
        preview: responseText.substring(0, 200)
      });

      // Validate that we got JSON
      if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
        paymentDebugger.error('PaymentAnalyticsApi', 'Response is not JSON', {
          responsePreview: responseText.substring(0, 500)
        });
        throw new Error('Invalid response format: expected JSON but got text');
      }

      const data = JSON.parse(responseText);
      paymentDebugger.info('PaymentAnalyticsApi', 'Successfully parsed JSON response', {
        hasData: !!data,
        dataKeys: Object.keys(data || {})
      });

      return data;
    } catch (error) {
      paymentDebugger.error('PaymentAnalyticsApi', 'Failed to fetch payment analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Test method to verify API connectivity
  async testConnection(adminToken: string): Promise<boolean> {
    paymentDebugger.info('PaymentAnalyticsApi', 'Testing API connection');
    
    try {
      // Try a simple endpoint first
      const response = await this.makeRequest('/api/auth/verify-admin-token', {
        method: 'GET',
        headers: {
          'x-admin-token': adminToken,
        },
      });

      const isConnected = response.ok;
      paymentDebugger.info('PaymentAnalyticsApi', 'Connection test result', { 
        isConnected,
        status: response.status 
      });

      return isConnected;
    } catch (error) {
      paymentDebugger.error('PaymentAnalyticsApi', 'Connection test failed', { error });
      return false;
    }
  }

  // Get debug information
  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      logs: paymentDebugger.getAllLogs(),
      summary: paymentDebugger.getSummary()
    };
  }
}

export const paymentAnalyticsApi = new PaymentAnalyticsApiService();