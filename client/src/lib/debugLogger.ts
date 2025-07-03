/**
 * Comprehensive Debug Logger for Payment Analytics
 * This helps track exactly what's happening with API requests
 */

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
}

class PaymentAnalyticsDebugger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;

  log(level: DebugLog['level'], component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry: DebugLog = {
      timestamp,
      level,
      component,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // Keep only the last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with emoji for visibility
    const emoji = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    console.log(`${emoji[level]} [${component}] ${message}`, data ? data : '');
  }

  info(component: string, message: string, data?: any) {
    this.log('info', component, message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.log('warn', component, message, data);
  }

  error(component: string, message: string, data?: any) {
    this.log('error', component, message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.log('debug', component, message, data);
  }

  // Get all logs for debugging
  getAllLogs() {
    return this.logs;
  }

  // Get logs by component
  getLogsByComponent(component: string) {
    return this.logs.filter(log => log.component === component);
  }

  // Clear logs
  clear() {
    this.logs = [];
    console.clear();
  }

  // Export logs as JSON for debugging
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  // Show summary of issues
  getSummary() {
    const errors = this.logs.filter(log => log.level === 'error');
    const warnings = this.logs.filter(log => log.level === 'warn');
    
    return {
      totalLogs: this.logs.length,
      errors: errors.length,
      warnings: warnings.length,
      recentErrors: errors.slice(-5),
      recentWarnings: warnings.slice(-5)
    };
  }
}

// Global debug instance
export const paymentDebugger = new PaymentAnalyticsDebugger();

// Add to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).paymentDebugger = paymentDebugger;
}