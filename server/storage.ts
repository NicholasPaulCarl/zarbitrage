import { users, alertHistory, featureRequests, dailySpreads, blacklistedEmails, subscriptionSettings, tradeJournal, webhookAlerts, paymentLogs, registrationStages, type User, type InsertUser, type AlertHistory, type InsertAlertHistory, type FeatureRequest, type InsertFeatureRequest, type UpdateFeatureRequest, type DailySpread, type InsertDailySpread, type UpdateDailySpread, type BlacklistedEmail, type InsertBlacklistedEmail, type SubscriptionSettings, type UpdateSubscriptionSettings, type TradeJournal, type InsertTradeJournal, type UpdateTradeJournal, type TradeFilter, type WebhookAlert, type InsertWebhookAlert, type UpdateWebhookAlert, type PaymentLog, type InsertPaymentLog, type RegistrationStage, type InsertRegistrationStage } from "@shared/schema";
import bcrypt from 'bcrypt';

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updatePassword(id: number, newPassword: string): Promise<boolean>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getDeletedUsers(): Promise<User[]>;
  setAdminStatus(id: number, isAdmin: boolean): Promise<boolean>;
  deactivateUser(id: number): Promise<boolean>;
  activateUser(id: number): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  restoreUser(id: number): Promise<boolean>;
  purgeDeletedUsers(): Promise<boolean>;
  
  // Blacklisted email methods
  isEmailBlacklisted(email: string): Promise<boolean>;
  blacklistEmail(email: string, userId: number, reason?: string): Promise<BlacklistedEmail>;
  getBlacklistedEmails(): Promise<BlacklistedEmail[]>;
  
  // Alert history methods
  getAlerts(): Promise<AlertHistory[]>;
  createAlert(alert: InsertAlertHistory): Promise<AlertHistory>;
  clearAlerts(): Promise<void>;
  
  // Feature request methods
  getFeatureRequests(): Promise<FeatureRequest[]>;
  getFeatureRequestsByUser(userId: number): Promise<FeatureRequest[]>;
  getFeatureRequest(id: number): Promise<FeatureRequest | undefined>;
  createFeatureRequest(request: InsertFeatureRequest): Promise<FeatureRequest>;
  updateFeatureRequest(id: number, data: UpdateFeatureRequest): Promise<FeatureRequest | undefined>;
  
  // Daily spread tracking methods
  getDailySpreads(period?: string): Promise<DailySpread[]>;
  getDailySpreadsByDateRange(startDate: Date, endDate: Date): Promise<DailySpread[]>;
  getDailySpreadByDate(date: Date, route: string): Promise<DailySpread | undefined>;
  createDailySpread(spread: InsertDailySpread): Promise<DailySpread>;
  updateDailySpread(id: number, data: UpdateDailySpread): Promise<DailySpread | undefined>;
  recordSpreadData(buyExchange: string, sellExchange: string, spreadPercentage: number): Promise<void>;
  
  // Hourly spread tracking methods
  getHourlySpreads(hours?: number): Promise<{ hourTimestamp: string; highestSpread: number; lowestSpread: number; averageSpread?: number; route: string; dataPoints?: number; }[]>;
  getHourlySpreadsByDateRange(startDate: Date, endDate: Date): Promise<{ hourTimestamp: string; highestSpread: number; lowestSpread: number; averageSpread?: number; route: string; dataPoints?: number; }[]>;
  recordHourlySpreadData(buyExchange: string, sellExchange: string, spreadPercentage: number): Promise<void>;
  
  // Subscription settings methods
  getSubscriptionSettings(): Promise<SubscriptionSettings>;
  updateSubscriptionSettings(settings: UpdateSubscriptionSettings): Promise<SubscriptionSettings>;
  
  // Trade journal methods (premium feature)
  getTradeJournalEntries(userId: number, filter?: TradeFilter): Promise<TradeJournal[]>;
  getTradeJournalEntry(id: number): Promise<TradeJournal | undefined>;
  createTradeJournalEntry(entry: InsertTradeJournal): Promise<TradeJournal>;
  updateTradeJournalEntry(id: number, data: UpdateTradeJournal): Promise<TradeJournal | undefined>;
  deleteTradeJournalEntry(id: number): Promise<boolean>;
  // Get unique values for filtering
  getTradeJournalExchanges(userId: number): Promise<string[]>;
  getTradeJournalPairs(userId: number): Promise<string[]>;
  getTradeJournalTags(userId: number): Promise<string[]>;
  
  // Webhook alert methods
  getWebhookAlerts(userId: number): Promise<WebhookAlert[]>;
  getWebhookAlert(id: number): Promise<WebhookAlert | undefined>;
  createWebhookAlert(alert: InsertWebhookAlert): Promise<WebhookAlert>;
  updateWebhookAlert(id: number, data: UpdateWebhookAlert): Promise<WebhookAlert | undefined>;
  deleteWebhookAlert(id: number): Promise<boolean>;
  getActiveWebhookAlerts(userId: number): Promise<WebhookAlert[]>;
  incrementWebhookTriggerCount(id: number): Promise<void>;
  
  // Payment logging methods
  createPaymentLog(log: InsertPaymentLog): Promise<PaymentLog>;
  getPaymentLogs(userId: number): Promise<PaymentLog[]>;
  getPaymentLogsByStage(userId: number, stage: string): Promise<PaymentLog[]>;
  getUsersWithIncompletePayments(): Promise<User[]>;
  
  // Registration stage tracking methods
  createRegistrationStage(stage: InsertRegistrationStage): Promise<RegistrationStage>;
  getRegistrationStages(userId: number): Promise<RegistrationStage[]>;
  getUserRegistrationStatus(userId: number): Promise<string>;
  updateUserRegistrationStage(userId: number, stage: string): Promise<boolean>;
  
  // Carousel management methods
  getCarousels(): Promise<Carousel[]>;
  getActiveCarousels(): Promise<Carousel[]>;
  getCarousel(id: number): Promise<Carousel | undefined>;
  createCarousel(carousel: InsertCarousel): Promise<Carousel>;
  updateCarousel(id: number, data: UpdateCarousel): Promise<Carousel | undefined>;
  deleteCarousel(id: number): Promise<boolean>;
  reorderCarousels(carouselIds: number[]): Promise<boolean>;
}

// Memory-based storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private alerts: Map<number, AlertHistory>;
  private featureRequests: Map<number, FeatureRequest>;
  private dailySpreads: Map<number, DailySpread>;
  private subscriptionConfig: SubscriptionSettings;
  private blacklistedEmails: Map<number, BlacklistedEmail>;
  private deletedUsers: User[];
  private userCurrentId: number;
  private alertCurrentId: number;
  private featureRequestCurrentId: number;
  private dailySpreadCurrentId: number;
  private blacklistedEmailCurrentId: number;

  constructor() {
    this.users = new Map();
    this.alerts = new Map();
    this.featureRequests = new Map();
    this.dailySpreads = new Map();
    this.blacklistedEmails = new Map();
    this.deletedUsers = [];
    this.userCurrentId = 4; // Start after the test users
    this.alertCurrentId = 1;
    this.featureRequestCurrentId = 1;
    this.dailySpreadCurrentId = 1;
    this.blacklistedEmailCurrentId = 1;
    
    // Initialize default subscription settings
    this.subscriptionConfig = {
      id: 1,
      priceMonthlyCents: 500, // $5.00
      priceAnnuallyCents: 4800, // $48.00
      currency: "USD",
      defaultBillingFrequency: "monthly",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // Initialize sample data for testing
  private initializeSampleData(): void {
    // Create a test user account with Cypress-expected credentials
    const userPassword = bcrypt.hashSync('user123', 10);
    this.users.set(1, {
      id: 1, 
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      profilePicture: null,
      createdAt: new Date(),
      subscriptionActive: true,
      subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subscriptionPaymentId: 'test-payment-id',
      isAdmin: false,
      isDeleted: false,
      deletedAt: null
    });
    
    // Create an admin user account with Cypress-expected credentials
    const adminPassword = bcrypt.hashSync('admin123', 10);
    this.users.set(2, {
      id: 2, 
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      profilePicture: null,
      createdAt: new Date(),
      subscriptionActive: true,
      subscriptionExpires: null,
      subscriptionPaymentId: null,
      isAdmin: true,
      isDeleted: false,
      deletedAt: null
    });
    
    // Create an additional legacy test user for backwards compatibility
    const legacyPassword = bcrypt.hashSync('password123', 10);
    this.users.set(3, {
      id: 3, 
      username: 'testuser',
      email: 'test@example.com',
      password: legacyPassword,
      profilePicture: null,
      createdAt: new Date(),
      subscriptionActive: true,
      subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subscriptionPaymentId: 'legacy-test-payment-id',
      isAdmin: false,
      isDeleted: false,
      deletedAt: null
    });
    
    // Create sample alert data
    const today = new Date();
    
    // Sample routes for variety
    const routes = [
      "Bitstamp → LUNO",
      "Bitfinex → LUNO",
      "Bitstamp → VALR",
      "Bitfinex → VALR"
    ];
    
    // Create sample alerts with realistic spread percentages
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Create 1-3 alerts for each day with different spread values
      const numAlerts = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numAlerts; j++) {
        // Random spread between 2.5% and 4.5%
        const spreadPercentage = 2.5 + (Math.random() * 2.0);
        // Calculate spread amount (assuming 1 BTC at ~$80,000 with ZAR rate of ~19)
        const spread = spreadPercentage / 100 * 80000 * 19;
        
        // Get a random route
        const route = routes[Math.floor(Math.random() * routes.length)];
        
        // Add a few hours offset for each alert in the same day
        const alertTime = new Date(date);
        alertTime.setHours(alertTime.getHours() - j * 2);
        
        // Create and add the alert
        const alert: AlertHistory = {
          id: this.alertCurrentId++,
          route,
          spread,
          spreadPercentage,
          timestamp: alertTime
        };
        
        this.alerts.set(alert.id, alert);
      }
    }
    
    // Removed mock daily spread data initialization - use real data only
  }
  
  // Removed initializeDailySpreadData method - system now uses only real data collected from APIs
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      profilePicture: null,
      subscriptionActive: insertUser.subscriptionActive || false,
      subscriptionExpires: insertUser.subscriptionExpires || null,
      subscriptionPaymentId: insertUser.subscriptionPaymentId || null,
      isAdmin: false // default to non-admin
    };
    this.users.set(id, user);
    return user;
  }
  
  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async setAdminStatus(id: number, isAdmin: boolean): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    user.isAdmin = isAdmin;
    this.users.set(id, user);
    return true;
  }
  
  async deactivateUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    user.subscriptionActive = false;
    this.users.set(id, user);
    return true;
  }
  
  async activateUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    // Set subscription as active and set expiration to 30 days from now
    user.subscriptionActive = true;
    user.subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.users.set(id, user);
    return true;
  }
  
  // Feature request methods
  async getFeatureRequests(): Promise<FeatureRequest[]> {
    return Array.from(this.featureRequests.values());
  }
  
  async getFeatureRequestsByUser(userId: number): Promise<FeatureRequest[]> {
    return Array.from(this.featureRequests.values())
      .filter(request => request.userId === userId);
  }
  
  async getFeatureRequest(id: number): Promise<FeatureRequest | undefined> {
    return this.featureRequests.get(id);
  }
  
  async createFeatureRequest(request: InsertFeatureRequest): Promise<FeatureRequest> {
    const id = this.featureRequestCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const featureRequest: FeatureRequest = {
      ...request,
      id,
      status: 'pending',
      createdAt,
      updatedAt,
      adminNotes: null
    };
    
    this.featureRequests.set(id, featureRequest);
    return featureRequest;
  }
  
  async updateFeatureRequest(id: number, data: UpdateFeatureRequest): Promise<FeatureRequest | undefined> {
    const request = await this.getFeatureRequest(id);
    if (!request) {
      return undefined;
    }
    
    const updatedRequest = { 
      ...request,
      ...data,
      updatedAt: new Date()
    };
    
    this.featureRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Alert history methods
  async getAlerts(): Promise<AlertHistory[]> {
    // Return alerts sorted by timestamp in descending order (newest first)
    return Array.from(this.alerts.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createAlert(insertAlert: InsertAlertHistory): Promise<AlertHistory> {
    const id = this.alertCurrentId++;
    const timestamp = new Date();
    
    // Create the alert with timestamp and ID
    const alert: AlertHistory = { 
      ...insertAlert, 
      id,
      timestamp
    };
    
    // Add the new alert
    this.alerts.set(id, alert);
    
    // Maintain maximum of 30 alerts - remove the oldest if needed
    const allAlerts = await this.getAlerts();
    if (allAlerts.length > 30) {
      // Get the oldest alert (last one after sorting by timestamp descending)
      const oldestAlert = allAlerts[allAlerts.length - 1];
      this.alerts.delete(oldestAlert.id);
    }
    
    return alert;
  }

  async clearAlerts(): Promise<void> {
    this.alerts.clear();
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    // Update user properties
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    // Update password
    user.password = newPassword;
    this.users.set(id, user);
    return true;
  }

  // Daily spread tracking methods
  async getDailySpreads(period?: string): Promise<DailySpread[]> {
    // Get current date and calculate start date based on period
    const today = new Date();
    let startDate = new Date();

    if (period) {
      switch(period) {
        case "7d":
          startDate.setDate(today.getDate() - 7);
          break;
        case "14d":
          startDate.setDate(today.getDate() - 14);
          break;
        case "30d":
        default:
          startDate.setDate(today.getDate() - 30);
          break;
      }
    } else {
      // Default to 30 days
      startDate.setDate(today.getDate() - 30);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    return Array.from(this.dailySpreads.values())
      .filter(spread => {
        // Compare dates as strings (YYYY-MM-DD)
        const spreadDate = typeof spread.date === 'string' 
          ? spread.date
          : new Date(spread.date).toISOString().split('T')[0];
        return spreadDate >= startDateStr;
      })
      .sort((a, b) => {
        // Sort by date ascending
        const dateA = typeof a.date === 'string' 
          ? new Date(a.date).getTime() 
          : new Date(a.date).getTime();
        const dateB = typeof b.date === 'string' 
          ? new Date(b.date).getTime() 
          : new Date(b.date).getTime();
        return dateA - dateB;
      });
  }
  
  async getDailySpreadsByDateRange(startDate: Date, endDate: Date): Promise<DailySpread[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return Array.from(this.dailySpreads.values())
      .filter(spread => {
        const spreadDate = typeof spread.date === 'string' 
          ? spread.date
          : new Date(spread.date).toISOString().split('T')[0];
        return spreadDate >= startDateStr && spreadDate <= endDateStr;
      })
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' 
          ? new Date(a.date).getTime() 
          : new Date(a.date).getTime();
        const dateB = typeof b.date === 'string' 
          ? new Date(b.date).getTime() 
          : new Date(b.date).getTime();
        return dateA - dateB;
      });
  }
  
  async getDailySpreadByDate(date: Date, route: string): Promise<DailySpread | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.dailySpreads.values())
      .find(spread => {
        const spreadDate = typeof spread.date === 'string' 
          ? spread.date
          : new Date(spread.date).toISOString().split('T')[0];
        return spreadDate === dateStr && spread.route === route;
      });
  }
  
  async createDailySpread(spread: InsertDailySpread): Promise<DailySpread> {
    const id = this.dailySpreadCurrentId++;
    const now = new Date();
    
    const dailySpread: DailySpread = {
      id,
      date: spread.date,
      buyExchange: spread.buyExchange,
      sellExchange: spread.sellExchange,
      route: spread.route,
      highestSpread: spread.highestSpread,
      lowestSpread: spread.lowestSpread,
      averageSpread: spread.averageSpread || 0,
      dataPoints: spread.dataPoints || 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.dailySpreads.set(id, dailySpread);
    return dailySpread;
  }
  
  async updateDailySpread(id: number, data: UpdateDailySpread): Promise<DailySpread | undefined> {
    const spread = this.dailySpreads.get(id);
    if (!spread) {
      return undefined;
    }
    
    const updatedSpread: DailySpread = {
      ...spread,
      highestSpread: data.highestSpread !== undefined ? data.highestSpread : spread.highestSpread,
      lowestSpread: data.lowestSpread !== undefined ? data.lowestSpread : spread.lowestSpread,
      averageSpread: data.averageSpread !== undefined ? data.averageSpread : spread.averageSpread,
      dataPoints: data.dataPoints !== undefined ? data.dataPoints : spread.dataPoints,
      updatedAt: new Date()
    };
    
    this.dailySpreads.set(id, updatedSpread);
    return updatedSpread;
  }
  
  async recordSpreadData(buyExchange: string, sellExchange: string, spreadPercentage: number): Promise<void> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const route = `${buyExchange} → ${sellExchange}`;
    
    // Check if we already have a record for today and this route
    const existingSpread = Array.from(this.dailySpreads.values())
      .find(spread => {
        const spreadDate = typeof spread.date === 'string' 
          ? spread.date
          : new Date(spread.date).toISOString().split('T')[0];
        return spreadDate === dateStr && spread.route === route;
      });
    
    if (existingSpread) {
      // Update existing record
      const id = existingSpread.id;
      const currentHigh = existingSpread.highestSpread;
      const currentLow = existingSpread.lowestSpread;
      const currentAvg = existingSpread.averageSpread || spreadPercentage;
      const currentPoints = existingSpread.dataPoints || 1;
      
      // Calculate new values
      const newHigh = Math.max(currentHigh, spreadPercentage);
      const newLow = Math.min(currentLow, spreadPercentage);
      const newPoints = currentPoints + 1;
      // Calculate new running average
      const newAvg = ((currentAvg * currentPoints) + spreadPercentage) / newPoints;
      
      await this.updateDailySpread(id, {
        highestSpread: newHigh,
        lowestSpread: newLow,
        averageSpread: newAvg,
        dataPoints: newPoints
      });
    } else {
      // Create new record - the spread is both highest and lowest initially
      await this.createDailySpread({
        date: dateStr,
        buyExchange,
        sellExchange,
        route,
        highestSpread: spreadPercentage,
        lowestSpread: spreadPercentage,
        averageSpread: spreadPercentage,
        dataPoints: 1
      });
    }
  }

  // Hourly spread methods - basic stubs for in-memory storage
  async getHourlySpreads(hours: number = 24): Promise<{ hourTimestamp: string; highestSpread: number; lowestSpread: number; averageSpread?: number; route: string; dataPoints?: number; }[]> {
    // For in-memory storage, return empty array
    return [];
  }

  async getHourlySpreadsByDateRange(startDate: Date, endDate: Date): Promise<{ hourTimestamp: string; highestSpread: number; lowestSpread: number; averageSpread?: number; route: string; dataPoints?: number; }[]> {
    // For in-memory storage, return empty array
    return [];
  }

  async recordHourlySpreadData(buyExchange: string, sellExchange: string, spreadPercentage: number): Promise<void> {
    // For in-memory storage, this is a no-op
    return Promise.resolve();
  }
}

// Import PostgreSQL storage implementation
import { pgStorage } from './db';

// Export the appropriate storage implementation
// We'll use PostgreSQL storage if available, falling back to memory storage if there's an issue
let storage: IStorage;

// Initialize storage with proper async handling
async function initializeStorage(): Promise<IStorage> {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - falling back to in-memory storage");
    return new MemStorage();
  }

  try {
    // Initialize PostgreSQL storage
    await pgStorage.initialize();
    console.log("Successfully initialized PostgreSQL storage");
    return pgStorage;
  } catch (err) {
    console.error("Failed to initialize PostgreSQL storage:", err);
    console.warn("Falling back to in-memory storage");
    return new MemStorage();
  }
}

// Initialize storage asynchronously
storage = new MemStorage(); // Default fallback
initializeStorage().then(initialized => {
  storage = initialized;
  console.log("Storage initialization complete");
}).catch(err => {
  console.error("Storage initialization failed:", err);
  console.warn("Using in-memory storage as fallback");
});

export { storage, pgStorage };