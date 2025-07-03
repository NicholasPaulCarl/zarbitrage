// Simple in-memory storage for webhook alerts
interface WebhookAlert {
  id: number;
  userId: number;
  name: string;
  webhookUrl: string;
  isActive: boolean;
  triggerThreshold: string;
  customPayload?: string;
  httpMethod: string;
  headers?: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface InsertWebhookAlert {
  userId: number;
  name: string;
  webhookUrl: string;
  isActive?: boolean;
  triggerThreshold: string;
  customPayload?: string;
  httpMethod?: string;
  headers?: string;
}

interface UpdateWebhookAlert {
  name?: string;
  webhookUrl?: string;
  isActive?: boolean;
  triggerThreshold?: string;
  customPayload?: string;
  httpMethod?: string;
  headers?: string;
}

class WebhookStorage {
  private webhookAlerts: Map<number, WebhookAlert> = new Map();
  private currentId: number = 1;

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Add a sample webhook for testing
    const sampleWebhook: WebhookAlert = {
      id: this.currentId++,
      userId: 1,
      name: "Discord Webhook",
      webhookUrl: "https://discord.com/api/webhooks/your-webhook-here",
      isActive: false,
      triggerThreshold: "3.0",
      httpMethod: "POST",
      createdAt: new Date(),
      triggerCount: 0,
      customPayload: JSON.stringify({
        content: "🚨 **Arbitrage Alert** 🚨",
        embeds: [{
          title: "{{route}}",
          description: "Spread: **{{spreadPercentage}}%**",
          color: 5763719,
          fields: [
            { name: "Buy", value: "{{buyExchange}} - ${{buyPrice}}", inline: true },
            { name: "Sell", value: "{{sellExchange}} - ${{sellPrice}}", inline: true },
            { name: "Profit", value: "${{spread}}", inline: true }
          ],
          timestamp: "{{timestamp}}"
        }]
      })
    };
    this.webhookAlerts.set(sampleWebhook.id, sampleWebhook);
  }

  async getWebhookAlerts(userId: number): Promise<WebhookAlert[]> {
    return Array.from(this.webhookAlerts.values()).filter(webhook => webhook.userId === userId);
  }

  async getWebhookAlert(id: number): Promise<WebhookAlert | undefined> {
    return this.webhookAlerts.get(id);
  }

  async createWebhookAlert(alert: InsertWebhookAlert): Promise<WebhookAlert> {
    const newAlert: WebhookAlert = {
      id: this.currentId++,
      userId: alert.userId,
      name: alert.name,
      webhookUrl: alert.webhookUrl,
      isActive: alert.isActive ?? true,
      triggerThreshold: alert.triggerThreshold,
      customPayload: alert.customPayload,
      httpMethod: alert.httpMethod ?? "POST",
      headers: alert.headers,
      createdAt: new Date(),
      triggerCount: 0
    };

    this.webhookAlerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  async updateWebhookAlert(id: number, data: UpdateWebhookAlert): Promise<WebhookAlert | undefined> {
    const existing = this.webhookAlerts.get(id);
    if (!existing) return undefined;

    const updated: WebhookAlert = {
      ...existing,
      ...data
    };

    this.webhookAlerts.set(id, updated);
    return updated;
  }

  async deleteWebhookAlert(id: number): Promise<boolean> {
    return this.webhookAlerts.delete(id);
  }

  async getActiveWebhookAlerts(userId: number): Promise<WebhookAlert[]> {
    return Array.from(this.webhookAlerts.values()).filter(
      webhook => webhook.userId === userId && webhook.isActive
    );
  }

  async incrementWebhookTriggerCount(id: number): Promise<void> {
    const webhook = this.webhookAlerts.get(id);
    if (webhook) {
      webhook.triggerCount += 1;
      webhook.lastTriggered = new Date();
    }
  }
}

export const webhookStorage = new WebhookStorage();
export type { WebhookAlert, InsertWebhookAlert, UpdateWebhookAlert };