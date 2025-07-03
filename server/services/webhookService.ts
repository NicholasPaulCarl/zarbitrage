import axios from 'axios';
import { ArbitrageOpportunity } from '@shared/schema';

interface WebhookConfig {
  id: number;
  name: string;
  webhookUrl: string;
  triggerThreshold: string;
  customPayload?: string;
  httpMethod: string;
  headers?: string;
}

/**
 * Service for sending webhook notifications when arbitrage opportunities are detected
 */
export class WebhookService {
  
  /**
   * Send a webhook notification for an arbitrage opportunity
   */
  async sendWebhookAlert(
    webhookConfig: WebhookConfig,
    opportunity: ArbitrageOpportunity
  ): Promise<boolean> {
    try {
      const payload = this.buildPayload(webhookConfig, opportunity);
      const headers = this.parseHeaders(webhookConfig.headers);
      
      const response = await axios({
        method: webhookConfig.httpMethod.toLowerCase() as 'post' | 'put' | 'patch',
        url: webhookConfig.webhookUrl,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CryptoArbitrage-Alert-Bot/1.0',
          ...headers
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`Webhook ${webhookConfig.name} sent successfully. Status: ${response.status}`);
      return response.status >= 200 && response.status < 300;
      
    } catch (error) {
      console.error(`Failed to send webhook ${webhookConfig.name}:`, error);
      return false;
    }
  }

  /**
   * Build the payload for the webhook
   */
  private buildPayload(webhookConfig: WebhookConfig, opportunity: ArbitrageOpportunity): any {
    // If custom payload is provided, try to parse and use it
    if (webhookConfig.customPayload) {
      try {
        const template = JSON.parse(webhookConfig.customPayload);
        return this.replaceTemplateVariables(template, opportunity);
      } catch (error) {
        console.warn(`Invalid custom payload for webhook ${webhookConfig.name}, using default`);
      }
    }

    // Default payload structure
    return {
      type: 'arbitrage_alert',
      alert_name: webhookConfig.name,
      timestamp: new Date().toISOString(),
      opportunity: {
        route: opportunity.route,
        buy_exchange: opportunity.buyExchange,
        sell_exchange: opportunity.sellExchange,
        spread_percentage: opportunity.spreadPercentage,
        spread_amount: opportunity.spread,
        buy_price: opportunity.buyPrice,
        sell_price: opportunity.sellPrice
      },
      message: `🚨 Arbitrage Alert: ${opportunity.spreadPercentage.toFixed(2)}% spread detected on ${opportunity.route}`
    };
  }

  /**
   * Replace template variables in custom payload
   */
  private replaceTemplateVariables(template: any, opportunity: ArbitrageOpportunity): any {
    const templateStr = JSON.stringify(template);
    const replacedStr = templateStr
      .replace(/\{\{route\}\}/g, opportunity.route)
      .replace(/\{\{buyExchange\}\}/g, opportunity.buyExchange)
      .replace(/\{\{sellExchange\}\}/g, opportunity.sellExchange)
      .replace(/\{\{spreadPercentage\}\}/g, opportunity.spreadPercentage.toString())
      .replace(/\{\{spread\}\}/g, opportunity.spread.toString())
      .replace(/\{\{buyPrice\}\}/g, opportunity.buyPrice.toString())
      .replace(/\{\{sellPrice\}\}/g, opportunity.sellPrice.toString())
      .replace(/\{\{timestamp\}\}/g, new Date().toISOString());
    
    return JSON.parse(replacedStr);
  }

  /**
   * Parse custom headers from JSON string
   */
  private parseHeaders(headersStr?: string): Record<string, string> {
    if (!headersStr) return {};
    
    try {
      return JSON.parse(headersStr);
    } catch (error) {
      console.warn('Invalid headers JSON, ignoring custom headers');
      return {};
    }
  }

  /**
   * Test a webhook configuration by sending a test alert
   */
  async testWebhook(webhookConfig: WebhookConfig): Promise<boolean> {
    const testOpportunity: ArbitrageOpportunity = {
      route: 'TEST → TEST',
      buyExchange: 'TEST_BUY',
      sellExchange: 'TEST_SELL',
      buyPrice: 50000,
      sellPrice: 51000,
      spread: 1000,
      spreadPercentage: 2.0
    };

    return this.sendWebhookAlert(webhookConfig, testOpportunity);
  }
}

export const webhookService = new WebhookService();