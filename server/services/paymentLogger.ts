import { pgStorage } from '../db';

// Simple payment flow logger to track user journeys and debug issues
export class PaymentLogger {
  private static getClientInfo(req: any) {
    return {
      sessionId: req.sessionID || 'unknown',
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };
  }

  static async logPaymentStage(
    userId: number, 
    stage: string, 
    provider: string, 
    req?: any,
    metadata?: any,
    errorMessage?: string
  ) {
    try {
      const clientInfo = req ? this.getClientInfo(req) : {};
      
      console.log(`[PAYMENT LOG] User ${userId} - Stage: ${stage} - Provider: ${provider}`, {
        timestamp: new Date().toISOString(),
        sessionId: clientInfo.sessionId,
        metadata,
        errorMessage
      });

      // Log to database if tables exist
      try {
        await pgStorage.createPaymentLog({
          userId,
          sessionId: clientInfo.sessionId,
          stage,
          provider,
          metadata: metadata ? JSON.stringify(metadata) : null,
          errorMessage,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        });
      } catch (dbError) {
        // If logging table doesn't exist yet, just continue with console logging
        console.log(`[PAYMENT LOG] Database logging not available, using console only`);
      }

    } catch (error) {
      console.error('Error in payment logging:', error);
    }
  }

  static async updateUserStage(userId: number, stage: string) {
    try {
      console.log(`[USER STAGE] User ${userId} moved to stage: ${stage}`);
      
      // Try to update user registration stage
      try {
        await pgStorage.updateUserRegistrationStage(userId, stage);
        await pgStorage.createRegistrationStage({
          userId,
          stage,
          metadata: JSON.stringify({ timestamp: new Date().toISOString() })
        });
      } catch (dbError) {
        console.log(`[USER STAGE] Database update not available, using console only`);
      }
    } catch (error) {
      console.error('Error updating user stage:', error);
    }
  }

  static async getIncompletePaymentUsers() {
    try {
      return await pgStorage.getUsersWithIncompletePayments();
    } catch (error) {
      console.error('Error getting incomplete payment users:', error);
      return [];
    }
  }

  static async getUserPaymentHistory(userId: number) {
    try {
      return await pgStorage.getPaymentLogs(userId);
    } catch (error) {
      console.error('Error getting user payment history:', error);
      return [];
    }
  }
}