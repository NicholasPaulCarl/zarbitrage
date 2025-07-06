import { pgTable, text, serial, integer, boolean, timestamp, real, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Subscription fields
  subscriptionActive: boolean("subscription_active").default(false).notNull(),
  subscriptionExpires: timestamp("subscription_expires"),
  subscriptionPaymentId: text("subscription_payment_id"),
  // Admin flag
  isAdmin: boolean("is_admin").default(false).notNull(),
  // Deletion tracking
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  // Registration stage tracking
  registrationStage: text("registration_stage").default("registered").notNull(), // registered, payment_initiated, payment_completed
  registrationCompletedAt: timestamp("registration_completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  subscriptionActive: true,
  subscriptionExpires: true,
  subscriptionPaymentId: true,
  isAdmin: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  route: text("route").notNull(),
  spread: real("spread").notNull(),
  spreadPercentage: real("spread_percentage").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAlertHistorySchema = createInsertSchema(alertHistory).pick({
  route: true,
  spread: true,
  spreadPercentage: true,
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = z.infer<typeof insertAlertHistorySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Exchange API response types
export const exchangeSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.enum(["USD", "ZAR"]),
  timestamp: z.string().datetime().optional()
});

export const exchangeRateSchema = z.object({
  rate: z.number(),
  timestamp: z.string().datetime().optional()
});

export const arbitrageOpportunitySchema = z.object({
  buyExchange: z.string(),
  sellExchange: z.string(),
  route: z.string(),
  buyPrice: z.number(),
  sellPrice: z.number(),
  spread: z.number(),
  spreadPercentage: z.number()
});

export const historicalSpreadSchema = z.object({
  date: z.string(),
  highestSpread: z.number(),
  lowestSpread: z.number().optional(),
  route: z.string()
});

export const hourlySpreadSchema = z.object({
  hourTimestamp: z.string(), // ISO timestamp rounded to the hour
  highestSpread: z.number(),
  lowestSpread: z.number(),
  averageSpread: z.number().optional(),
  route: z.string(),
  dataPoints: z.number().optional()
});

// Exchange fee data 
export const exchangeFeeSchema = z.object({
  name: z.string(),
  tradingFeePercentage: z.number(),
  withdrawalFeeUSD: z.number().optional(),
  withdrawalFeeZAR: z.number().optional()
});

// Calculator schemas
export const calculatorInputSchema = z.object({
  opportunityId: z.string().optional(),
  buyExchange: z.string().optional(),
  sellExchange: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  customBuyFee: z.number().min(0, "Fee cannot be negative").optional(),
  customSellFee: z.number().min(0, "Fee cannot be negative").optional(),
  transferFee: z.number().min(0, "Fee cannot be negative").optional()
});

export const calculatorResultSchema = z.object({
  buyExchange: z.string(),
  sellExchange: z.string(),
  investmentAmount: z.number(),
  buyPrice: z.number(),
  sellPrice: z.number(),
  buyFeePercentage: z.number(),
  sellFeePercentage: z.number(),
  transferFee: z.number(),
  buyFeeAmount: z.number(),
  sellFeeAmount: z.number(),
  totalFees: z.number(),
  grossProfit: z.number(),
  netProfit: z.number(), 
  netProfitPercentage: z.number(),
  isProfit: z.boolean()
});

export type Exchange = z.infer<typeof exchangeSchema>;
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
export type ArbitrageOpportunity = z.infer<typeof arbitrageOpportunitySchema>;
export type HistoricalSpread = z.infer<typeof historicalSpreadSchema>;
export type HourlySpread = z.infer<typeof hourlySpreadSchema>;
export type ExchangeFee = z.infer<typeof exchangeFeeSchema>;
export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
export type CalculatorResult = z.infer<typeof calculatorResultSchema>;
// Payment schemas
export const paymentSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'completed', 'failed', 'expired']),
  amount: z.number(),
  currency: z.enum(['BTC']),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  paymentUrl: z.string().url(),
  paymentAddress: z.string().optional(),
  userId: z.number().optional(),
  qrCode: z.string().optional(), // QR code data URL
});

export const subscriptionSchema = z.object({
  userId: z.number(),
  active: z.boolean(),
  expiresAt: z.string().datetime(),
  paymentId: z.string(),
  renewalUrl: z.string().url().optional(),
});

// Feature request table
export const featureRequests = pgTable("feature_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  adminNotes: text("admin_notes"),
});

export const insertFeatureRequestSchema = createInsertSchema(featureRequests).pick({
  userId: true,
  title: true,
  description: true,
});

export const updateFeatureRequestSchema = z.object({
  status: z.enum(["pending", "in-progress", "completed", "rejected"]).optional(),
  adminNotes: z.string().optional(),
});

export type FeatureRequest = typeof featureRequests.$inferSelect;
export type InsertFeatureRequest = z.infer<typeof insertFeatureRequestSchema>;
export type UpdateFeatureRequest = z.infer<typeof updateFeatureRequestSchema>;

export type Payment = z.infer<typeof paymentSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
// Daily exchange spread table to track high and low values
export const dailySpreads = pgTable("daily_spreads", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  buyExchange: text("buy_exchange").notNull(),
  sellExchange: text("sell_exchange").notNull(),
  route: text("route").notNull(),
  highestSpread: real("highest_spread").notNull(),
  lowestSpread: real("lowest_spread").notNull(),
  averageSpread: real("average_spread"),
  dataPoints: integer("data_points").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDailySpreadSchema = createInsertSchema(dailySpreads).pick({
  date: true,
  buyExchange: true,
  sellExchange: true,
  route: true,
  highestSpread: true,
  lowestSpread: true,
  averageSpread: true,
  dataPoints: true,
});

export const updateDailySpreadSchema = z.object({
  highestSpread: z.number().optional(),
  lowestSpread: z.number().optional(),
  averageSpread: z.number().optional(),
  dataPoints: z.number().optional(),
});

export const dailySpreadSchema = z.object({
  date: z.string(),
  buyExchange: z.string(),
  sellExchange: z.string(),
  route: z.string(),
  highestSpread: z.number(),
  lowestSpread: z.number(),
  averageSpread: z.number().optional(),
  dataPoints: z.number().optional()
});

export type DailySpread = typeof dailySpreads.$inferSelect;
export type InsertDailySpread = z.infer<typeof insertDailySpreadSchema>;
export type UpdateDailySpread = z.infer<typeof updateDailySpreadSchema>;

// Blacklisted emails table to prevent reuse of deleted user emails
export const blacklistedEmails = pgTable("blacklisted_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  reason: text("reason"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBlacklistedEmailSchema = createInsertSchema(blacklistedEmails).pick({
  email: true,
  reason: true,
  userId: true,
});

export type BlacklistedEmail = typeof blacklistedEmails.$inferSelect;
export type InsertBlacklistedEmail = z.infer<typeof insertBlacklistedEmailSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;

// Subscription settings table for admin configuration
export const subscriptionSettings = pgTable("subscription_settings", {
  id: serial("id").primaryKey(),
  priceMonthlyCents: integer("price_monthly_cents").notNull().default(500), // Default $5.00
  priceAnnuallyCents: integer("price_annually_cents").notNull().default(4800), // Default $48.00
  currency: text("currency").notNull().default("USD"),
  defaultBillingFrequency: text("default_billing_frequency").notNull().default("monthly"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionSettingsSchema = z.object({
  priceMonthlyCents: z.number().int().min(0),
  priceAnnuallyCents: z.number().int().min(0),
  currency: z.enum(["USD", "ZAR", "EUR", "GBP"]),
  defaultBillingFrequency: z.enum(["monthly", "annually"]),
});

export const updateSubscriptionSettingsSchema = subscriptionSettingsSchema.partial();

export type SubscriptionSettings = typeof subscriptionSettings.$inferSelect;
export type UpdateSubscriptionSettings = z.infer<typeof updateSubscriptionSettingsSchema>;

// Trade journal table for premium users to track their trades
export const tradeJournal = pgTable("trade_journal", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tradeDate: timestamp("trade_date").notNull(),
  exchange: text("exchange").notNull(),
  tradePair: text("trade_pair").notNull(), // e.g., "BTC/USD"
  tradeType: text("trade_type").notNull(), // "buy" or "sell"
  price: numeric("price").notNull(),
  amount: numeric("amount").notNull(),
  fee: numeric("fee"),
  notes: text("notes"),
  profitLoss: numeric("profit_loss"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTradeJournalSchema = createInsertSchema(tradeJournal).pick({
  userId: true,
  tradeDate: true,
  exchange: true,
  tradePair: true,
  tradeType: true,
  price: true,
  amount: true,
  fee: true,
  notes: true,
  profitLoss: true,
  tags: true,
});

export const updateTradeJournalSchema = z.object({
  tradeDate: z.preprocess((val) => val ? new Date(val as string) : undefined, z.date().optional()),
  exchange: z.string().optional(),
  tradePair: z.string().optional(),
  tradeType: z.enum(["buy", "sell"]).optional(),
  price: z.preprocess((val) => val ? parseFloat(val as string) : undefined, z.number().positive("Price must be positive").optional()),
  amount: z.preprocess((val) => val ? parseFloat(val as string) : undefined, z.number().positive("Amount must be positive").optional()),
  fee: z.preprocess((val) => val === "" || val === null || val === undefined ? null : parseFloat(val as string), z.number().min(0, "Fee cannot be negative").nullable().optional()),
  notes: z.string().optional(),
  profitLoss: z.preprocess((val) => val === "" || val === null || val === undefined ? null : parseFloat(val as string), z.number().nullable().optional()),
  tags: z.array(z.string()).optional(),
});

export const tradeFilterSchema = z.object({
  exchange: z.string().optional(),
  tradePair: z.string().optional(),
  tradeType: z.enum(["buy", "sell"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

export type TradeJournal = typeof tradeJournal.$inferSelect;
export type InsertTradeJournal = z.infer<typeof insertTradeJournalSchema>;
export type UpdateTradeJournal = z.infer<typeof updateTradeJournalSchema>;
export type TradeFilter = z.infer<typeof tradeFilterSchema>;

// Webhook Alert Configuration
export const webhookAlerts = pgTable("webhook_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  triggerThreshold: text("trigger_threshold").notNull(),
  customPayload: text("custom_payload"), // JSON string for custom payload template
  httpMethod: text("http_method").default("POST").notNull(),
  headers: text("headers"), // JSON string for custom headers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0).notNull()
});

export const insertWebhookAlertSchema = createInsertSchema(webhookAlerts).pick({
  userId: true,
  name: true,
  webhookUrl: true,
  isActive: true,
  triggerThreshold: true,
  customPayload: true,
  httpMethod: true,
  headers: true
});

export const updateWebhookAlertSchema = z.object({
  name: z.string().min(1).optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  triggerThreshold: z.string().optional(),
  customPayload: z.string().optional(),
  httpMethod: z.enum(["POST", "PUT", "PATCH"]).optional(),
  headers: z.string().optional()
});

export type WebhookAlert = typeof webhookAlerts.$inferSelect;
export type InsertWebhookAlert = z.infer<typeof insertWebhookAlertSchema>;
export type UpdateWebhookAlert = z.infer<typeof updateWebhookAlertSchema>;

// Payment flow logging table
export const paymentLogs = pgTable("payment_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id"),
  paymentId: text("payment_id"),
  stage: text("stage").notNull(), // initiated, created, redirected, completed, failed, abandoned
  provider: text("provider"), // yoco, opennode, mock
  amount: numeric("amount"),
  currency: text("currency"),
  metadata: text("metadata"), // JSON string for additional data
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Registration stage tracking table
export const registrationStages = pgTable("registration_stages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stage: text("stage").notNull(), // account_created, email_verified, payment_initiated, payment_completed, onboarding_completed
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  metadata: text("metadata"), // JSON string for stage-specific data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Carousel management table for homepage banners
export const carousels = pgTable("carousels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCarouselSchema = createInsertSchema(carousels).pick({
  title: true,
  description: true,
  imageUrl: true,
  ctaText: true,
  ctaLink: true,
  isActive: true,
  sortOrder: true,
});

export const updateCarouselSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Please provide a valid image URL").optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().refine((val) => {
    if (!val || val === "") return true; // Optional field
    // Allow internal paths (starting with /) or full URLs
    return val.startsWith('/') || val.match(/^https?:\/\/.+/);
  }, "Please provide a valid URL (http://...) or internal path (/page)").optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type Carousel = typeof carousels.$inferSelect;
export type InsertCarousel = z.infer<typeof insertCarouselSchema>;
export type UpdateCarousel = z.infer<typeof updateCarouselSchema>;

export const insertPaymentLogSchema = createInsertSchema(paymentLogs).pick({
  userId: true,
  sessionId: true,
  paymentId: true,
  stage: true,
  provider: true,
  amount: true,
  currency: true,
  metadata: true,
  errorMessage: true,
  ipAddress: true,
  userAgent: true,
});

export const insertRegistrationStageSchema = createInsertSchema(registrationStages).pick({
  userId: true,
  stage: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
});

export type PaymentLog = typeof paymentLogs.$inferSelect;
export type InsertPaymentLog = z.infer<typeof insertPaymentLogSchema>;
export type RegistrationStage = typeof registrationStages.$inferSelect;
export type InsertRegistrationStage = z.infer<typeof insertRegistrationStageSchema>;
