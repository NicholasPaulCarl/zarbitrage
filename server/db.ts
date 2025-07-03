import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq, desc, and, ilike, gte, lte, is, isNotNull } from 'drizzle-orm';
import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcrypt';
import { users, alertHistory, featureRequests, dailySpreads, blacklistedEmails, subscriptionSettings, tradeJournal, carousels, User, InsertUser, AlertHistory, InsertAlertHistory, FeatureRequest, InsertFeatureRequest, UpdateFeatureRequest, DailySpread, InsertDailySpread, UpdateDailySpread, BlacklistedEmail, SubscriptionSettings, UpdateSubscriptionSettings, TradeJournal, InsertTradeJournal, UpdateTradeJournal, TradeFilter, Carousel, InsertCarousel, UpdateCarousel } from '@shared/schema';
import type { WebhookAlert, InsertWebhookAlert, UpdateWebhookAlert } from './webhookStorage';
import { IStorage } from './storage';

// Connect to PostgreSQL database with a connection pool for better reliability
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
});

// Storage implementation using PostgreSQL
export class PgStorage implements IStorage {
  // Blacklisted emails table handling
  async isEmailBlacklisted(email: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT * FROM blacklisted_emails WHERE email = $1 LIMIT 1', 
        [email]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking blacklisted email:", error);
      return false;
    }
  }
  
  async blacklistEmail(email: string, userId: number, reason?: string): Promise<BlacklistedEmail> {
    try {
      // Make sure we have a blacklisted_emails table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_emails (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id),
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      const result = await pool.query(
        'INSERT INTO blacklisted_emails (email, user_id, reason) VALUES ($1, $2, $3) RETURNING *',
        [email, userId, reason || 'Deleted by admin']
      );
      
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        userId: result.rows[0].user_id,
        reason: result.rows[0].reason,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      console.error("Error blacklisting email:", error);
      throw error;
    }
  }
  
  async getBlacklistedEmails(): Promise<BlacklistedEmail[]> {
    try {
      const result = await pool.query('SELECT * FROM blacklisted_emails ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        userId: row.user_id,
        reason: row.reason,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("Error fetching blacklisted emails:", error);
      return [];
    }
  }
  
  // Functions to manage deleted users
  async getDeletedUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE is_deleted = TRUE ORDER BY deleted_at DESC');
      
      if (result.rows.length === 0) {
        return [];
      }
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        profilePicture: row.profile_picture,
        createdAt: row.created_at,
        subscriptionActive: row.subscription_active || false,
        subscriptionExpires: row.subscription_expires || null,
        subscriptionPaymentId: row.subscription_payment_id || null,
        isAdmin: row.is_admin || false,
        isDeleted: row.is_deleted || true, // Force to true since we're only selecting deleted users
        deletedAt: row.deleted_at || new Date() // Ensure we have a date
      }));
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      return [];
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Get the user first to verify it exists
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return false;
      }
      
      // Mark the user as deleted without blacklisting their email
      await pool.query(
        'UPDATE users SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      
      console.log(`User ${id} marked as deleted without blacklisting email`);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async restoreUser(id: number): Promise<boolean> {
    try {
      // First, check if the user exists and is deleted
      const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1 AND is_deleted = TRUE', [id]);
      if (userCheck.rows.length === 0) {
        console.log(`User ${id} not found or not marked as deleted`);
        return false;
      }
      
      // Restore the user by updating the is_deleted flag
      await pool.query(
        'UPDATE users SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1',
        [id]
      );
      
      console.log(`User ${id} successfully restored`);
      return true;
    } catch (error) {
      console.error("Error restoring user:", error);
      return false;
    }
  }

  async purgeDeletedUsers(): Promise<boolean> {
    try {
      // Permanently delete all users marked as deleted
      const result = await pool.query('DELETE FROM users WHERE is_deleted = TRUE');
      
      console.log(`Permanently deleted ${result.rowCount} users from database`);
      return true;
    } catch (error) {
      console.error("Error purging deleted users:", error);
      return false;
    }
  }
  async initialize() {
    try {
      console.log("Connecting to PostgreSQL database with URL:", process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : "Not set");
      // Test connection without explicit connect - Pool will manage connections
      await pool.query('SELECT NOW()');
      console.log("Successfully connected to PostgreSQL database");

      // Create tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          profile_picture TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          subscription_active BOOLEAN DEFAULT FALSE,
          subscription_expires TIMESTAMP,
          subscription_payment_id TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          is_deleted BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMP
        );
      `);
      
      // Check if is_deleted and deleted_at columns exist, add them if not
      const columnsCheckQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('is_deleted', 'deleted_at');
      `;
      
      const columnsResult = await pool.query(columnsCheckQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('is_deleted')) {
        console.log('Adding is_deleted column to users table');
        await pool.query('ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE');
      }
      
      if (!existingColumns.includes('deleted_at')) {
        console.log('Adding deleted_at column to users table');
        await pool.query('ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP');
      }
      
      console.log('Confirmed user columns exist');
      
      // Check if any users exist
      const usersCheckResult = await pool.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(usersCheckResult.rows[0].count);
      
      // If no users exist, create demo users
      if (userCount === 0) {
        console.log('No users found. Creating demo users...');
        
        // Admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
          INSERT INTO users (username, email, password, is_admin, subscription_active)
          VALUES ('admin', 'admin@example.com', $1, TRUE, TRUE)
        `, [adminPassword]);
        
        // Regular users with different statuses
        const regularPassword = await bcrypt.hash('user123', 10);
        await pool.query(`
          INSERT INTO users (username, email, password, subscription_active)
          VALUES 
            ('user1', 'user1@example.com', $1, TRUE),
            ('user2', 'user2@example.com', $1, TRUE),
            ('user3', 'user3@example.com', $1, FALSE),
            ('user4', 'user4@example.com', $1, FALSE)
        `, [regularPassword]);
        
        console.log('Demo users created successfully');
      }
      
      // Create feature requests table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feature_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          admin_notes TEXT
        );
      `);
      
      // Check if columns exist, add them if not
      try {
        // Add profile_picture if it doesn't exist
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS profile_picture TEXT;
        `);
        console.log("Confirmed profile_picture column exists");
        
        // Add subscription columns if they don't exist
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE;
        `);
        
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMP;
        `);
        
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS subscription_payment_id TEXT;
        `);
        
        // Add admin column if it doesn't exist
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
        `);
        
        // Add deletion tracking columns if they don't exist
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        `);
        
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
        `);
        
        console.log("Confirmed user columns exist");
        
        // Create subscription settings table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS subscription_settings (
            id SERIAL PRIMARY KEY,
            price_monthly_cents INTEGER NOT NULL DEFAULT 500,
            price_quarterly_cents INTEGER NOT NULL DEFAULT 1350,
            price_annually_cents INTEGER NOT NULL DEFAULT 4800,
            currency TEXT NOT NULL DEFAULT 'USD',
            default_billing_frequency TEXT NOT NULL DEFAULT 'monthly',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Check if we need to insert default subscription settings
        const settingsExist = await pool.query('SELECT 1 FROM subscription_settings LIMIT 1');
        if (settingsExist.rows.length === 0) {
          console.log('Inserting default subscription settings');
          await pool.query(`
            INSERT INTO subscription_settings 
            (price_monthly_cents, price_annually_cents, currency, default_billing_frequency)
            VALUES (500, 4800, 'USD', 'monthly')
          `);
        }
        
        console.log('Confirmed subscription_settings table exists');
      } catch (error) {
        console.log("Error checking/adding columns:", error);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS alert_history (
          id SERIAL PRIMARY KEY,
          route TEXT NOT NULL,
          spread DOUBLE PRECISION NOT NULL,
          spread_percentage DOUBLE PRECISION NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create daily spreads table to track high and low values for each exchange pair
      await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_spreads (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          buy_exchange TEXT NOT NULL,
          sell_exchange TEXT NOT NULL,
          route TEXT NOT NULL,
          highest_spread REAL NOT NULL,
          lowest_spread REAL NOT NULL,
          average_spread REAL,
          data_points INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create subscription settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscription_settings (
          id SERIAL PRIMARY KEY,
          price_monthly_cents INTEGER NOT NULL DEFAULT 500,
          price_quarterly_cents INTEGER NOT NULL DEFAULT 1350,
          price_annually_cents INTEGER NOT NULL DEFAULT 4800,
          currency TEXT NOT NULL DEFAULT 'USD',
          default_billing_frequency TEXT NOT NULL DEFAULT 'monthly',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create trade journal table for premium users
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trade_journal (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          trade_date TIMESTAMP NOT NULL,
          exchange TEXT NOT NULL,
          trade_pair TEXT NOT NULL,
          trade_type TEXT NOT NULL,
          price NUMERIC NOT NULL,
          amount NUMERIC NOT NULL,
          fee NUMERIC,
          notes TEXT,
          profit_loss NUMERIC,
          tags TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // We don't need this section anymore since we're creating demo users above
      
      // Initialize the sequence for IDs if needed
      await pool.query('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users))');
      await pool.query('SELECT setval(\'alert_history_id_seq\', (SELECT MAX(id) FROM alert_history))');
      
      // Initialize feature_requests sequence if the table exists
      try {
        await pool.query('SELECT setval(\'feature_requests_id_seq\', (SELECT MAX(id) FROM feature_requests))');
      } catch (error) {
        console.log("No feature requests yet, skipping sequence initialization");
      }

    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        password: result.rows[0].password,
        profilePicture: result.rows[0].profile_picture,
        createdAt: result.rows[0].created_at,
        subscriptionActive: result.rows[0].subscription_active || false,
        subscriptionExpires: result.rows[0].subscription_expires || null,
        subscriptionPaymentId: result.rows[0].subscription_payment_id || null,
        isAdmin: result.rows[0].is_admin || false,
        isDeleted: result.rows[0].is_deleted || false,
        deletedAt: result.rows[0].deleted_at || null,
      };
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        password: result.rows[0].password,
        profilePicture: result.rows[0].profile_picture,
        createdAt: result.rows[0].created_at,
        subscriptionActive: result.rows[0].subscription_active || false,
        subscriptionExpires: result.rows[0].subscription_expires || null,
        subscriptionPaymentId: result.rows[0].subscription_payment_id || null,
        isAdmin: result.rows[0].is_admin || false,
        isDeleted: result.rows[0].is_deleted || false,
        deletedAt: result.rows[0].deleted_at || null,
      };
    } catch (error) {
      console.error("Error fetching user by username:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return undefined;
      }
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        password: result.rows[0].password,
        profilePicture: result.rows[0].profile_picture,
        createdAt: result.rows[0].created_at,
        subscriptionActive: result.rows[0].subscription_active || false,
        subscriptionExpires: result.rows[0].subscription_expires || null,
        subscriptionPaymentId: result.rows[0].subscription_payment_id || null,
        isAdmin: result.rows[0].is_admin || false,
        isDeleted: result.rows[0].is_deleted || false,
        deletedAt: result.rows[0].deleted_at || null
      };
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await pool.query(`
        INSERT INTO users (username, email, password, is_admin, subscription_active, subscription_expires, subscription_payment_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        user.username, 
        user.email, 
        user.password, 
        user.isAdmin || false,
        user.subscriptionActive || false,
        user.subscriptionExpires || null,
        user.subscriptionPaymentId || null
      ]);
      
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        password: result.rows[0].password,
        profilePicture: result.rows[0].profile_picture,
        createdAt: result.rows[0].created_at,
        subscriptionActive: result.rows[0].subscription_active || false,
        subscriptionExpires: result.rows[0].subscription_expires || null,
        subscriptionPaymentId: result.rows[0].subscription_payment_id || null,
        isAdmin: result.rows[0].is_admin || false,
        isDeleted: result.rows[0].is_deleted || false,
        deletedAt: result.rows[0].deleted_at || null,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getAlerts(): Promise<AlertHistory[]> {
    try {
      const result = await pool.query('SELECT * FROM alert_history ORDER BY timestamp DESC');
      return result.rows.map(row => ({
        id: row.id,
        route: row.route,
        spread: row.spread,
        spreadPercentage: row.spread_percentage,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error("Error fetching alerts:", error);
      throw error;
    }
  }

  async createAlert(alert: InsertAlertHistory): Promise<AlertHistory> {
    try {
      const result = await pool.query(`
        INSERT INTO alert_history (route, spread, spread_percentage)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [alert.route, alert.spread, alert.spreadPercentage]);
      
      // Maintain maximum of 30 alerts - remove the oldest if needed
      const count = await pool.query('SELECT COUNT(*) FROM alert_history');
      if (parseInt(count.rows[0].count) > 30) {
        await pool.query(`
          DELETE FROM alert_history
          WHERE id IN (
            SELECT id FROM alert_history
            ORDER BY timestamp ASC
            LIMIT 1
          )
        `);
      }
      
      return {
        id: result.rows[0].id,
        route: result.rows[0].route,
        spread: result.rows[0].spread,
        spreadPercentage: result.rows[0].spread_percentage,
        timestamp: result.rows[0].timestamp,
      };
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  }

  async clearAlerts(): Promise<void> {
    try {
      await pool.query('DELETE FROM alert_history');
    } catch (error) {
      console.error("Error clearing alerts:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      // Create SET clause for SQL query based on what fields are being updated
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      // Check each field that can be updated
      if (userData.username !== undefined) {
        updateFields.push(`username = $${paramCounter++}`);
        values.push(userData.username);
      }
      
      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramCounter++}`);
        values.push(userData.email);
      }
      
      if (userData.profilePicture !== undefined) {
        updateFields.push(`profile_picture = $${paramCounter++}`);
        values.push(userData.profilePicture);
      }
      
      // Subscription fields
      if (userData.subscriptionActive !== undefined) {
        updateFields.push(`subscription_active = $${paramCounter++}`);
        values.push(userData.subscriptionActive);
      }
      
      if (userData.subscriptionExpires !== undefined) {
        updateFields.push(`subscription_expires = $${paramCounter++}`);
        values.push(userData.subscriptionExpires);
      }
      
      if (userData.subscriptionPaymentId !== undefined) {
        updateFields.push(`subscription_payment_id = $${paramCounter++}`);
        values.push(userData.subscriptionPaymentId);
      }
      
      if (userData.isAdmin !== undefined) {
        updateFields.push(`is_admin = $${paramCounter++}`);
        values.push(userData.isAdmin);
      }
      
      // If no fields to update, return the user unchanged
      if (updateFields.length === 0) {
        return this.getUser(id);
      }
      
      // Add ID for WHERE clause
      values.push(id);
      
      // Build and execute the query
      const result = await pool.query(`
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        password: result.rows[0].password,
        profilePicture: result.rows[0].profile_picture,
        createdAt: result.rows[0].created_at,
        subscriptionActive: result.rows[0].subscription_active || false,
        subscriptionExpires: result.rows[0].subscription_expires || null,
        subscriptionPaymentId: result.rows[0].subscription_payment_id || null,
        isAdmin: result.rows[0].is_admin || false,
        isDeleted: result.rows[0].is_deleted || false,
        deletedAt: result.rows[0].deleted_at || null,
      };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    try {
      const result = await pool.query(`
        UPDATE users
        SET password = $1
        WHERE id = $2
        RETURNING id
      `, [newPassword, id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }
  
  // Admin methods
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        profilePicture: row.profile_picture,
        createdAt: row.created_at,
        subscriptionActive: row.subscription_active || false,
        subscriptionExpires: row.subscription_expires || null,
        subscriptionPaymentId: row.subscription_payment_id || null,
        isAdmin: row.is_admin || false,
        isDeleted: row.is_deleted || false,
        deletedAt: row.deleted_at || null,
      }));
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }
  
  async setAdminStatus(id: number, isAdmin: boolean): Promise<boolean> {
    try {
      const result = await pool.query(`
        UPDATE users
        SET is_admin = $1
        WHERE id = $2
        RETURNING id
      `, [isAdmin, id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error setting admin status:", error);
      throw error;
    }
  }
  
  async deactivateUser(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        UPDATE users
        SET subscription_active = false
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }
  
  async activateUser(id: number): Promise<boolean> {
    try {
      // Set subscription as active and set expiration to 30 days from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const result = await pool.query(`
        UPDATE users
        SET subscription_active = true,
            subscription_expires = $1
        WHERE id = $2
        RETURNING id
      `, [expirationDate, id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error activating user:", error);
      throw error;
    }
  }
  
  // Feature request methods
  async getFeatureRequests(): Promise<FeatureRequest[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM feature_requests
        ORDER BY updated_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminNotes: row.admin_notes,
      }));
    } catch (error) {
      console.error("Error fetching feature requests:", error);
      throw error;
    }
  }
  
  async getFeatureRequestsByUser(userId: number): Promise<FeatureRequest[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM feature_requests
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `, [userId]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminNotes: row.admin_notes,
      }));
    } catch (error) {
      console.error("Error fetching user feature requests:", error);
      throw error;
    }
  }
  
  async getFeatureRequest(id: number): Promise<FeatureRequest | undefined> {
    try {
      const result = await pool.query(`
        SELECT * FROM feature_requests
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminNotes: row.admin_notes,
      };
    } catch (error) {
      console.error("Error fetching feature request:", error);
      throw error;
    }
  }
  
  async createFeatureRequest(request: InsertFeatureRequest): Promise<FeatureRequest> {
    try {
      const result = await pool.query(`
        INSERT INTO feature_requests (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [request.userId, request.title, request.description]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminNotes: row.admin_notes,
      };
    } catch (error) {
      console.error("Error creating feature request:", error);
      throw error;
    }
  }
  
  // Daily spread tracking methods
  async getDailySpreads(period?: string): Promise<DailySpread[]> {
    try {
      let query = 'SELECT * FROM daily_spreads ORDER BY date DESC';
      
      // Filter by period if specified
      if (period) {
        const today = new Date();
        let startDate = new Date();
        
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
        
        query = `
          SELECT * FROM daily_spreads 
          WHERE date >= $1 
          ORDER BY date DESC
        `;
        
        const result = await pool.query(query, [startDate.toISOString().split('T')[0]]);
        
        return result.rows.map(row => ({
          id: row.id,
          date: row.date.toISOString().split('T')[0],
          buyExchange: row.buy_exchange,
          sellExchange: row.sell_exchange,
          route: row.route,
          highestSpread: row.highest_spread,
          lowestSpread: row.lowest_spread,
          averageSpread: row.average_spread,
          dataPoints: row.data_points,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
      
      // No period filter
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        buyExchange: row.buy_exchange,
        sellExchange: row.sell_exchange,
        route: row.route,
        highestSpread: row.highest_spread,
        lowestSpread: row.lowest_spread,
        averageSpread: row.average_spread,
        dataPoints: row.data_points,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error("Error fetching daily spreads:", error);
      throw error;
    }
  }
  
  async getDailySpreadByDate(date: Date, route: string): Promise<DailySpread | undefined> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const result = await pool.query(`
        SELECT * FROM daily_spreads
        WHERE date = $1 AND route = $2
      `, [dateStr, route]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return {
        id: result.rows[0].id,
        date: result.rows[0].date.toISOString().split('T')[0],
        buyExchange: result.rows[0].buy_exchange,
        sellExchange: result.rows[0].sell_exchange,
        route: result.rows[0].route,
        highestSpread: result.rows[0].highest_spread,
        lowestSpread: result.rows[0].lowest_spread,
        averageSpread: result.rows[0].average_spread,
        dataPoints: result.rows[0].data_points,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error("Error fetching daily spread by date:", error);
      throw error;
    }
  }
  
  async createDailySpread(spread: InsertDailySpread): Promise<DailySpread> {
    try {
      const result = await pool.query(`
        INSERT INTO daily_spreads 
        (date, buy_exchange, sell_exchange, route, highest_spread, lowest_spread, average_spread, data_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        spread.date,
        spread.buyExchange,
        spread.sellExchange,
        spread.route,
        spread.highestSpread,
        spread.lowestSpread,
        spread.averageSpread,
        spread.dataPoints || 1
      ]);
      
      return {
        id: result.rows[0].id,
        date: result.rows[0].date.toISOString().split('T')[0],
        buyExchange: result.rows[0].buy_exchange,
        sellExchange: result.rows[0].sell_exchange,
        route: result.rows[0].route,
        highestSpread: result.rows[0].highest_spread,
        lowestSpread: result.rows[0].lowest_spread,
        averageSpread: result.rows[0].average_spread,
        dataPoints: result.rows[0].data_points,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error("Error creating daily spread:", error);
      throw error;
    }
  }
  
  async updateDailySpread(id: number, data: UpdateDailySpread): Promise<DailySpread | undefined> {
    try {
      // Create SET clause for SQL query based on what fields are being updated
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      if (data.highestSpread !== undefined) {
        updateFields.push(`highest_spread = $${paramCounter++}`);
        values.push(data.highestSpread);
      }
      
      if (data.lowestSpread !== undefined) {
        updateFields.push(`lowest_spread = $${paramCounter++}`);
        values.push(data.lowestSpread);
      }
      
      if (data.averageSpread !== undefined) {
        updateFields.push(`average_spread = $${paramCounter++}`);
        values.push(data.averageSpread);
      }
      
      if (data.dataPoints !== undefined) {
        updateFields.push(`data_points = $${paramCounter++}`);
        values.push(data.dataPoints);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update, return the spread unchanged
      if (updateFields.length === 0) {
        const result = await pool.query('SELECT * FROM daily_spreads WHERE id = $1', [id]);
        if (result.rows.length === 0) return undefined;
        
        return {
          id: result.rows[0].id,
          date: result.rows[0].date.toISOString().split('T')[0],
          buyExchange: result.rows[0].buy_exchange,
          sellExchange: result.rows[0].sell_exchange,
          route: result.rows[0].route,
          highestSpread: result.rows[0].highest_spread,
          lowestSpread: result.rows[0].lowest_spread,
          averageSpread: result.rows[0].average_spread,
          dataPoints: result.rows[0].data_points,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at
        };
      }
      
      // Add ID for WHERE clause
      values.push(id);
      
      // Build and execute the query
      const result = await pool.query(`
        UPDATE daily_spreads
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return {
        id: result.rows[0].id,
        date: result.rows[0].date.toISOString().split('T')[0],
        buyExchange: result.rows[0].buy_exchange,
        sellExchange: result.rows[0].sell_exchange,
        route: result.rows[0].route,
        highestSpread: result.rows[0].highest_spread,
        lowestSpread: result.rows[0].lowest_spread,
        averageSpread: result.rows[0].average_spread,
        dataPoints: result.rows[0].data_points,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error("Error updating daily spread:", error);
      throw error;
    }
  }
  
  async recordSpreadData(buyExchange: string, sellExchange: string, spreadPercentage: number): Promise<void> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const route = `${buyExchange} → ${sellExchange}`;
      
      // Check if we already have a record for today and this route
      const existingResult = await pool.query(`
        SELECT * FROM daily_spreads
        WHERE date = $1 AND route = $2
      `, [dateStr, route]);
      
      if (existingResult.rows.length > 0) {
        // Update existing record
        const existing = existingResult.rows[0];
        const id = existing.id;
        const currentHigh = existing.highest_spread;
        const currentLow = existing.lowest_spread;
        const currentAvg = existing.average_spread || spreadPercentage;
        const currentPoints = existing.data_points || 1;
        
        // Calculate new values
        const newHigh = Math.max(currentHigh, spreadPercentage);
        const newLow = Math.min(currentLow, spreadPercentage);
        const newPoints = currentPoints + 1;
        // Calculate new running average
        const newAvg = ((currentAvg * currentPoints) + spreadPercentage) / newPoints;
        
        // Update the record
        await pool.query(`
          UPDATE daily_spreads
          SET highest_spread = $1, 
              lowest_spread = $2, 
              average_spread = $3, 
              data_points = $4,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [newHigh, newLow, newAvg, newPoints, id]);
      } else {
        // Create new record - the spread is both highest and lowest initially
        await pool.query(`
          INSERT INTO daily_spreads 
          (date, buy_exchange, sell_exchange, route, highest_spread, lowest_spread, average_spread, data_points)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
        `, [
          dateStr,
          buyExchange,
          sellExchange,
          route,
          spreadPercentage,
          spreadPercentage,
          spreadPercentage,
        ]);
      }
    } catch (error) {
      console.error("Error recording spread data:", error);
      throw error;
    }
  }

  async updateFeatureRequest(id: number, data: UpdateFeatureRequest): Promise<FeatureRequest | undefined> {
    try {
      // Create SET clause for SQL query based on what fields are being updated
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      // Check each field that can be updated
      if (data.status !== undefined) {
        updateFields.push(`status = $${paramCounter++}`);
        values.push(data.status);
      }
      
      if (data.adminNotes !== undefined) {
        updateFields.push(`admin_notes = $${paramCounter++}`);
        values.push(data.adminNotes);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update besides timestamp, just update the timestamp
      if (updateFields.length === 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      }
      
      // Add ID for WHERE clause
      values.push(id);
      
      // Build and execute the query
      const result = await pool.query(`
        UPDATE feature_requests
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        adminNotes: row.admin_notes,
      };
    } catch (error) {
      console.error("Error updating feature request:", error);
      throw error;
    }
  }

  // Subscription settings methods
  async getSubscriptionSettings(): Promise<SubscriptionSettings> {
    try {
      // Make sure the subscription_settings table exists
      await this.initialize();
      
      // Query for existing settings
      const result = await pool.query(`
        SELECT * FROM subscription_settings ORDER BY id LIMIT 1
      `);
      
      // If no settings exist, create default settings
      if (result.rows.length === 0) {
        // Insert default subscription settings
        const defaultSettings = await pool.query(`
          INSERT INTO subscription_settings 
          (price_monthly_cents, price_annually_cents, currency, default_billing_frequency) 
          VALUES (500, 4800, 'USD', 'monthly')
          RETURNING *
        `);
        
        const row = defaultSettings.rows[0];
        return {
          id: row.id,
          priceMonthlyCents: row.price_monthly_cents,
          priceAnnuallyCents: row.price_annually_cents,
          currency: row.currency,
          defaultBillingFrequency: row.default_billing_frequency,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
      
      // Return existing settings
      const row = result.rows[0];
      return {
        id: row.id,
        priceMonthlyCents: row.price_monthly_cents,
        priceAnnuallyCents: row.price_annually_cents,
        currency: row.currency,
        defaultBillingFrequency: row.default_billing_frequency,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error getting subscription settings:", error);
      throw error;
    }
  }
  
  async updateSubscriptionSettings(settings: UpdateSubscriptionSettings): Promise<SubscriptionSettings> {
    try {
      // Make sure the table exists first
      const currentSettings = await this.getSubscriptionSettings();
      
      // Prepare update fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      // Check each field that can be updated
      if (settings.priceMonthlyCents !== undefined) {
        updateFields.push(`price_monthly_cents = $${paramCounter++}`);
        values.push(settings.priceMonthlyCents);
      }
      

      
      if (settings.priceAnnuallyCents !== undefined) {
        updateFields.push(`price_annually_cents = $${paramCounter++}`);
        values.push(settings.priceAnnuallyCents);
      }
      
      if (settings.currency !== undefined) {
        updateFields.push(`currency = $${paramCounter++}`);
        values.push(settings.currency);
      }
      
      if (settings.defaultBillingFrequency !== undefined) {
        updateFields.push(`default_billing_frequency = $${paramCounter++}`);
        values.push(settings.defaultBillingFrequency);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add ID for WHERE clause
      values.push(currentSettings.id);
      
      // If there are no updates, just return the current settings
      if (updateFields.length === 1) {
        return currentSettings;
      }
      
      // Build and execute the query
      const result = await pool.query(`
        UPDATE subscription_settings
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `, values);
      
      const row = result.rows[0];
      return {
        id: row.id,
        priceMonthlyCents: row.price_monthly_cents,
        priceAnnuallyCents: row.price_annually_cents,
        currency: row.currency,
        defaultBillingFrequency: row.default_billing_frequency,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error updating subscription settings:", error);
      throw error;
    }
  }

  // Trade journal methods for premium users
  async getTradeJournalEntries(userId: number, filter?: TradeFilter): Promise<TradeJournal[]> {
    try {
      let query = `
        SELECT * FROM trade_journal
        WHERE user_id = $1
      `;
      
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      // Apply filters if provided
      if (filter) {
        if (filter.exchange) {
          query += ` AND exchange = $${paramIndex}`;
          queryParams.push(filter.exchange);
          paramIndex++;
        }
        
        if (filter.tradePair) {
          query += ` AND trade_pair = $${paramIndex}`;
          queryParams.push(filter.tradePair);
          paramIndex++;
        }
        
        if (filter.tradeType) {
          query += ` AND trade_type = $${paramIndex}`;
          queryParams.push(filter.tradeType);
          paramIndex++;
        }
        
        if (filter.startDate) {
          query += ` AND trade_date >= $${paramIndex}`;
          queryParams.push(filter.startDate);
          paramIndex++;
        }
        
        if (filter.endDate) {
          query += ` AND trade_date <= $${paramIndex}`;
          queryParams.push(filter.endDate);
          paramIndex++;
        }
        
        if (filter.tags && filter.tags.length > 0) {
          query += ` AND tags && $${paramIndex}`;
          queryParams.push(filter.tags);
          paramIndex++;
        }
      }
      
      query += ` ORDER BY trade_date DESC`;
      
      const result = await pool.query(query, queryParams);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        tradeDate: row.trade_date,
        exchange: row.exchange,
        tradePair: row.trade_pair,
        tradeType: row.trade_type,
        price: parseFloat(row.price),
        amount: parseFloat(row.amount),
        fee: row.fee ? parseFloat(row.fee) : null,
        notes: row.notes,
        profitLoss: row.profit_loss ? parseFloat(row.profit_loss) : null,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error("Error fetching trade journal entries:", error);
      return [];
    }
  }

  async getTradeJournalEntry(id: number): Promise<TradeJournal | undefined> {
    try {
      const result = await pool.query('SELECT * FROM trade_journal WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        tradeDate: row.trade_date,
        exchange: row.exchange,
        tradePair: row.trade_pair,
        tradeType: row.trade_type,
        price: parseFloat(row.price),
        amount: parseFloat(row.amount),
        fee: row.fee ? parseFloat(row.fee) : null,
        notes: row.notes,
        profitLoss: row.profit_loss ? parseFloat(row.profit_loss) : null,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error fetching trade journal entry:", error);
      return undefined;
    }
  }

  async createTradeJournalEntry(entry: InsertTradeJournal): Promise<TradeJournal> {
    try {
      const query = `
        INSERT INTO trade_journal (
          user_id, trade_date, exchange, trade_pair, trade_type,
          price, amount, fee, notes, profit_loss, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        entry.userId,
        entry.tradeDate,
        entry.exchange,
        entry.tradePair,
        entry.tradeType,
        entry.price,
        entry.amount,
        entry.fee || null,
        entry.notes || null,
        entry.profitLoss || null,
        entry.tags || []
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        tradeDate: row.trade_date,
        exchange: row.exchange,
        tradePair: row.trade_pair,
        tradeType: row.trade_type,
        price: parseFloat(row.price),
        amount: parseFloat(row.amount),
        fee: row.fee ? parseFloat(row.fee) : null,
        notes: row.notes,
        profitLoss: row.profit_loss ? parseFloat(row.profit_loss) : null,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error creating trade journal entry:", error);
      throw error;
    }
  }

  async updateTradeJournalEntry(id: number, data: UpdateTradeJournal): Promise<TradeJournal | undefined> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Only update fields that are provided
      if (data.tradeDate !== undefined) {
        fields.push(`trade_date = $${paramIndex++}`);
        values.push(data.tradeDate);
      }
      
      if (data.exchange !== undefined) {
        fields.push(`exchange = $${paramIndex++}`);
        values.push(data.exchange);
      }
      
      if (data.tradePair !== undefined) {
        fields.push(`trade_pair = $${paramIndex++}`);
        values.push(data.tradePair);
      }
      
      if (data.tradeType !== undefined) {
        fields.push(`trade_type = $${paramIndex++}`);
        values.push(data.tradeType);
      }
      
      if (data.price !== undefined) {
        fields.push(`price = $${paramIndex++}`);
        values.push(data.price);
      }
      
      if (data.amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(data.amount);
      }
      
      if (data.fee !== undefined) {
        fields.push(`fee = $${paramIndex++}`);
        values.push(data.fee);
      }
      
      if (data.notes !== undefined) {
        fields.push(`notes = $${paramIndex++}`);
        values.push(data.notes);
      }
      
      if (data.profitLoss !== undefined) {
        fields.push(`profit_loss = $${paramIndex++}`);
        values.push(data.profitLoss);
      }
      
      if (data.tags !== undefined) {
        fields.push(`tags = $${paramIndex++}`);
        values.push(data.tags);
      }
      
      // Add updated timestamp
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update, return the current entry
      if (fields.length === 1) { // Only updated_at was added
        return this.getTradeJournalEntry(id);
      }
      
      const query = `
        UPDATE trade_journal
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        tradeDate: row.trade_date,
        exchange: row.exchange,
        tradePair: row.trade_pair,
        tradeType: row.trade_type,
        price: parseFloat(row.price),
        amount: parseFloat(row.amount),
        fee: row.fee ? parseFloat(row.fee) : null,
        notes: row.notes,
        profitLoss: row.profit_loss ? parseFloat(row.profit_loss) : null,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Error updating trade journal entry:", error);
      return undefined;
    }
  }

  async deleteTradeJournalEntry(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM trade_journal WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error deleting trade journal entry:", error);
      return false;
    }
  }

  async getTradeJournalExchanges(userId: number): Promise<string[]> {
    try {
      const result = await pool.query(
        'SELECT DISTINCT exchange FROM trade_journal WHERE user_id = $1 ORDER BY exchange',
        [userId]
      );
      return result.rows.map(row => row.exchange);
    } catch (error) {
      console.error("Error fetching trade journal exchanges:", error);
      return [];
    }
  }

  async getTradeJournalPairs(userId: number): Promise<string[]> {
    try {
      const result = await pool.query(
        'SELECT DISTINCT trade_pair FROM trade_journal WHERE user_id = $1 ORDER BY trade_pair',
        [userId]
      );
      return result.rows.map(row => row.trade_pair);
    } catch (error) {
      console.error("Error fetching trade journal pairs:", error);
      return [];
    }
  }

  async getTradeJournalTags(userId: number): Promise<string[]> {
    try {
      const result = await pool.query(
        'SELECT DISTINCT unnest(tags) as tag FROM trade_journal WHERE user_id = $1 ORDER BY tag',
        [userId]
      );
      return result.rows.map(row => row.tag);
    } catch (error) {
      console.error("Error fetching trade journal tags:", error);
      return [];
    }
  }

  // Webhook alert methods (delegated to webhookStorage for now)
  async getWebhookAlerts(userId: number): Promise<WebhookAlert[]> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.getWebhookAlerts(userId);
  }

  async getWebhookAlert(id: number): Promise<WebhookAlert | undefined> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.getWebhookAlert(id);
  }

  async createWebhookAlert(alert: InsertWebhookAlert): Promise<WebhookAlert> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.createWebhookAlert(alert);
  }

  async updateWebhookAlert(id: number, data: UpdateWebhookAlert): Promise<WebhookAlert | undefined> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.updateWebhookAlert(id, data);
  }

  async deleteWebhookAlert(id: number): Promise<boolean> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.deleteWebhookAlert(id);
  }

  async getActiveWebhookAlerts(userId: number): Promise<WebhookAlert[]> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.getActiveWebhookAlerts(userId);
  }

  async incrementWebhookTriggerCount(id: number): Promise<void> {
    const { webhookStorage } = await import('./webhookStorage');
    return webhookStorage.incrementWebhookTriggerCount(id);
  }

  // Payment logging methods
  async createPaymentLog(log: InsertPaymentLog): Promise<PaymentLog> {
    const [result] = await this.db.insert(paymentLogs).values(log).returning();
    return result;
  }

  async getPaymentLogs(userId: number): Promise<PaymentLog[]> {
    return await this.db.select()
      .from(paymentLogs)
      .where(eq(paymentLogs.userId, userId))
      .orderBy(desc(paymentLogs.createdAt));
  }

  async getPaymentLogsByStage(userId: number, stage: string): Promise<PaymentLog[]> {
    return await this.db.select()
      .from(paymentLogs)
      .where(and(eq(paymentLogs.userId, userId), eq(paymentLogs.stage, stage)))
      .orderBy(desc(paymentLogs.createdAt));
  }

  async getUsersWithIncompletePayments(): Promise<User[]> {
    // Find users who initiated payment but didn't complete it (stage = payment_initiated)
    const incompletePaymentUsers = await this.db.select({ userId: paymentLogs.userId })
      .from(paymentLogs)
      .where(eq(paymentLogs.stage, 'initiated'))
      .groupBy(paymentLogs.userId);

    if (incompletePaymentUsers.length === 0) return [];

    const userIds = incompletePaymentUsers.map(u => u.userId);
    return await this.db.select()
      .from(users)
      .where(and(
        inArray(users.id, userIds),
        eq(users.subscriptionActive, false),
        eq(users.isDeleted, false)
      ));
  }

  // Registration stage tracking methods
  async createRegistrationStage(stage: InsertRegistrationStage): Promise<RegistrationStage> {
    const [result] = await this.db.insert(registrationStages).values(stage).returning();
    return result;
  }

  async getRegistrationStages(userId: number): Promise<RegistrationStage[]> {
    return await this.db.select()
      .from(registrationStages)
      .where(eq(registrationStages.userId, userId))
      .orderBy(desc(registrationStages.completedAt));
  }

  async getUserRegistrationStatus(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    return user?.registrationStage || 'registered';
  }

  async updateUserRegistrationStage(userId: number, stage: string): Promise<boolean> {
    try {
      const updateData: any = { registrationStage: stage };
      if (stage === 'payment_completed') {
        updateData.registrationCompletedAt = new Date();
      }

      await this.db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Error updating user registration stage:', error);
      return false;
    }
  }

  // Carousel management methods
  async getCarousels(): Promise<Carousel[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM carousels 
        ORDER BY sort_order ASC, id ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching carousels:', error);
      return [];
    }
  }

  async getActiveCarousels(): Promise<Carousel[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM carousels 
        WHERE is_active = true 
        ORDER BY sort_order ASC, id ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching active carousels:', error);
      return [];
    }
  }

  async getCarousel(id: number): Promise<Carousel | undefined> {
    try {
      const result = await pool.query(`
        SELECT * FROM carousels WHERE id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching carousel:', error);
      return undefined;
    }
  }

  async createCarousel(carousel: InsertCarousel): Promise<Carousel> {
    try {
      const result = await pool.query(`
        INSERT INTO carousels (title, description, image_url, cta_text, cta_link, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        carousel.title,
        carousel.description || null,
        carousel.imageUrl,
        carousel.ctaText || null,
        carousel.ctaLink || null,
        carousel.isActive !== undefined ? carousel.isActive : true,
        carousel.sortOrder !== undefined ? carousel.sortOrder : 0
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating carousel:', error);
      throw error;
    }
  }

  async updateCarousel(id: number, data: UpdateCarousel): Promise<Carousel | undefined> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (data.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.imageUrl !== undefined) {
        fields.push(`image_url = $${paramCount++}`);
        values.push(data.imageUrl);
      }
      if (data.ctaText !== undefined) {
        fields.push(`cta_text = $${paramCount++}`);
        values.push(data.ctaText);
      }
      if (data.ctaLink !== undefined) {
        fields.push(`cta_link = $${paramCount++}`);
        values.push(data.ctaLink);
      }
      if (data.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(data.isActive);
      }
      if (data.sortOrder !== undefined) {
        fields.push(`sort_order = $${paramCount++}`);
        values.push(data.sortOrder);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(`
        UPDATE carousels 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating carousel:', error);
      return undefined;
    }
  }

  async deleteCarousel(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        DELETE FROM carousels WHERE id = $1
      `, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting carousel:', error);
      return false;
    }
  }

  async reorderCarousels(carouselIds: number[]): Promise<boolean> {
    try {
      for (let i = 0; i < carouselIds.length; i++) {
        await this.db.update(carousels)
          .set({ sortOrder: i })
          .where(eq(carousels.id, carouselIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering carousels:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const pgStorage = new PgStorage();