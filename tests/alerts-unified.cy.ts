/// <reference types="cypress" />

// Unified Alerts Page Tests: Browser Alerts and Webhook Alerts functionality

describe('Unified Alerts Page', () => {
  before(() => {
    // Complete session reset before the entire test suite
    cy.resetSession();
  });

  beforeEach(() => {
    // Clear any existing authentication state for each test
    cy.logout();
    
    // Visit the alerts page (should redirect to login for unauthenticated users)
    cy.visit('/alerts');
  });

  after(() => {
    // Complete cleanup after the entire test suite
    cy.resetSession();
  });

  describe('Authentication and Access Control', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.url().should('include', '/login');
    });

    it('should display unified alerts page for authenticated users', () => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // Check page title and description
      cy.contains('h1', 'Alerts').should('be.visible');
      cy.contains('Manage your arbitrage opportunity notifications').should('be.visible');
      
      // Check tabs are present
      cy.get('[role="tablist"]').should('be.visible');
      cy.contains('Webhooks').should('be.visible');
      cy.contains('Browser').should('be.visible');
      cy.contains('WhatsApp').should('be.visible');
    });

    it('should show subscription guard for non-premium users', () => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // The page should still load but may show premium features guard
      cy.get('[data-testid="subscription-guard"], h1').should('exist');
    });
  });

  describe('Browser Alerts Tab', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // Ensure we're on the browser alerts tab
      cy.contains('Browser').click();
    });

    it('should display browser alerts interface', () => {
      // Check for single-page layout with both sections
      cy.contains('Alert Settings').should('be.visible');
      cy.contains('Alert History').should('be.visible');
    });

    it('should display alert settings in single-page layout', () => {
      // Check for alert settings components (no nested tabs)
      cy.contains('Alert Settings').should('be.visible');
      cy.contains('Spread Threshold').should('be.visible');
      
      // Check for threshold input
      cy.get('input[type="number"]').should('exist');
      
      // Check for toggle switches
      cy.get('[role="switch"]').should('exist');
    });

    it('should allow threshold adjustment', () => {
      // Find and update threshold input (no nested tabs)
      cy.get('input[type="number"]').first().clear().type('5.0');
      
      // The value should be updated
      cy.get('input[type="number"]').first().should('have.value', '5.0');
    });

    it('should display alert history', () => {
      // Check for alert history components (no nested tabs)
      cy.contains('Alert History').should('be.visible');
      cy.contains('Showing').should('be.visible');
      
      // History might be empty for new users, which is fine
      cy.get('[data-testid="alert-history"], .text-center').should('exist');
    });
  });

  describe('Admin Test Functionality', () => {
    beforeEach(() => {
      // Login as admin user to access test buttons
      cy.login('admin', 'admin123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // Ensure we're on the browser alerts tab
      cy.contains('Browser').click();
    });

    it('should display admin test buttons for admin users', () => {
      // Check for test buttons (should only be visible to admin)
      cy.contains('Test').should('be.visible');
      cy.contains('Multi').should('be.visible');
      
      // Verify buttons are clickable
      cy.contains('Test').should('not.be.disabled');
      cy.contains('Multi').should('not.be.disabled');
    });

    it('should test browser notifications when Test button is clicked', () => {
      // Click the test button
      cy.contains('Test').click();
      
      // Should show a toast notification with test result
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      cy.contains('Test Successful', { timeout: 5000 }).should('be.visible');
    });

    it('should create multiple toast notifications when Multi button is clicked', () => {
      // Click the multi test button
      cy.contains('Multi').click();
      
      // Should create multiple toast notifications
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('have.length.at.least', 2);
      
      // Should contain test alert content
      cy.contains('Test Alert', { timeout: 5000 }).should('be.visible');
    });

    it('should hide admin test buttons for non-admin users', () => {
      // Logout and login as regular user
      cy.logout();
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      cy.contains('Browser').click();
      
      // Test buttons should not be visible for regular users
      cy.contains('Test').should('not.exist');
      cy.contains('Multi').should('not.exist');
    });
  });

  describe('Toast Notification System', () => {
    beforeEach(() => {
      // Login as admin to access test functionality
      cy.login('admin', 'admin123');
      cy.waitForAuth();
      cy.visit('/alerts');
      cy.contains('Browser').click();
    });

    it('should display toast notifications with proper styling', () => {
      // Create a toast notification
      cy.contains('Test').click();
      
      // Check toast appears with proper styling
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="toast"], [role="alert"]').should('have.class', 'pointer-events-auto');
      
      // Check close button is positioned correctly
      cy.get('[data-testid="toast"] button, [role="alert"] button').should('be.visible');
    });

    it('should allow dismissing single toast notifications', () => {
      // Create a toast notification
      cy.contains('Test').click();
      
      // Wait for toast to appear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      
      // Click the close button (X)
      cy.get('[data-testid="toast"] button, [role="alert"] button').first().click();
      
      // Toast should disappear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 3000 }).should('not.exist');
    });

    it('should handle multiple stacked notifications correctly', () => {
      // Create multiple notifications
      cy.contains('Multi').click();
      
      // Wait for multiple toasts to appear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('have.length.at.least', 2);
      
      // All should be visible and properly stacked
      cy.get('[data-testid="toast"], [role="alert"]').each(($toast) => {
        cy.wrap($toast).should('be.visible');
        cy.wrap($toast).should('have.class', 'pointer-events-auto');
      });
    });

    it('should allow dismissing multiple stacked notifications individually', () => {
      // Create multiple notifications
      cy.contains('Multi').click();
      
      // Wait for multiple toasts to appear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('have.length.at.least', 2);
      
      // Get initial count
      cy.get('[data-testid="toast"], [role="alert"]').then(($toasts) => {
        const initialCount = $toasts.length;
        
        // Click close button on first toast
        cy.get('[data-testid="toast"] button, [role="alert"] button').first().click();
        
        // Should have one fewer toast
        cy.get('[data-testid="toast"], [role="alert"]', { timeout: 3000 }).should('have.length', initialCount - 1);
        
        // Remaining toasts should still be functional
        if (initialCount > 1) {
          cy.get('[data-testid="toast"] button, [role="alert"] button').first().click();
          cy.get('[data-testid="toast"], [role="alert"]', { timeout: 3000 }).should('have.length', initialCount - 2);
        }
      });
    });

    it('should not block navigation when toasts are present', () => {
      // Create multiple notifications
      cy.contains('Multi').click();
      
      // Wait for toasts to appear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      
      // Try to navigate to different tabs - should work normally
      cy.contains('Webhooks').click();
      cy.contains('Webhook Alerts').should('be.visible');
      
      // Navigate back to browser alerts
      cy.contains('Browser').click();
      cy.contains('Alert Settings').should('be.visible');
      
      // Try to click other UI elements
      cy.get('input[type="number"]').first().should('be.focusable');
      cy.get('[role="switch"]').first().should('be.visible');
    });

    it('should handle toast auto-dismissal correctly', () => {
      // Create a test notification
      cy.contains('Test').click();
      
      // Wait for toast to appear
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      
      // Wait for auto-dismissal (default is 5000ms, so wait 6 seconds)
      cy.wait(6000);
      
      // Toast should auto-dismiss
      cy.get('[data-testid="toast"], [role="alert"]').should('not.exist');
    });

    it('should display toast content correctly', () => {
      // Create test notifications
      cy.contains('Multi').click();
      
      // Check toast content
      cy.get('[data-testid="toast"], [role="alert"]', { timeout: 5000 }).should('be.visible');
      cy.contains('Test Alert').should('be.visible');
      cy.contains('spread').should('be.visible');
      
      // Check that different toasts have different content
      cy.get('[data-testid="toast"], [role="alert"]').should('contain.text', 'Binance');
      cy.get('[data-testid="toast"], [role="alert"]').should('contain.text', 'VALR');
    });
  });

  describe('Webhooks Tab', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // Switch to webhooks tab
      cy.contains('Webhooks').click();
    });

    it('should display webhooks interface', () => {
      // Check for webhooks section
      cy.contains('Webhook Alerts').should('be.visible');
      cy.contains('Create custom webhook alerts').should('be.visible');
      
      // Check for add webhook button
      cy.contains('Add Webhook').should('be.visible');
    });

    it('should open webhook creation dialog', () => {
      cy.contains('Add Webhook').click();
      
      // Check dialog is open
      cy.contains('Create Webhook Alert').should('be.visible');
      cy.contains('Configure a webhook to receive arbitrage alerts').should('be.visible');
      
      // Check form fields
      cy.get('input[placeholder*="My Discord Alert"]').should('be.visible');
      cy.get('input[placeholder*="3.0"]').should('be.visible');
      cy.get('input[placeholder*="https://discord.com"]').should('be.visible');
    });

    it('should display webhook template buttons', () => {
      cy.contains('Add Webhook').click();
      
      // Check template buttons
      cy.contains('Discord').should('be.visible');
      cy.contains('Slack').should('be.visible');
      cy.contains('Generic').should('be.visible');
    });

    it('should apply Discord template when clicked', () => {
      cy.contains('Add Webhook').click();
      
      // Click Discord template
      cy.contains('Discord').click();
      
      // Check that payload textarea is populated
      cy.get('textarea[placeholder*="Leave empty"]').should('contain.value', 'content');
      cy.get('textarea[placeholder*="Leave empty"]').should('contain.value', 'embeds');
    });

    it('should allow webhook form submission', () => {
      cy.contains('Add Webhook').click();
      
      // Fill out form
      cy.get('input[placeholder*="My Discord Alert"]').type('Test Webhook');
      cy.get('input[placeholder*="https://discord.com"]').type('https://discord.com/api/webhooks/test');
      cy.get('input[placeholder*="3.0"]').clear().type('4.0');
      
      // Submit should be enabled
      cy.contains('Create').should('not.be.disabled');
    });

    it('should display variables help section', () => {
      // Check for variables help
      cy.contains('Available Variables').should('be.visible');
      cy.contains('Use these variables in your custom payload').should('be.visible');
      
      // Check for some variable examples
      cy.get('code').should('contain.text', '{{route}}');
      cy.get('code').should('contain.text', '{{spreadPercentage}}');
    });

    it('should show empty state when no webhooks exist', () => {
      // For new users, should show empty state
      cy.contains('No webhook alerts configured').should('be.visible');
      cy.contains('Create your first webhook alert').should('be.visible');
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
    });

    it('should switch between webhooks, browser alerts and whatsapp tabs', () => {
      // Start on webhooks (default)
      cy.contains('Webhooks').should('have.attr', 'data-state', 'active');
      cy.contains('Add Webhook').should('be.visible');
      
      // Switch to browser alerts
      cy.contains('Browser').click();
      cy.contains('Browser').should('have.attr', 'data-state', 'active');
      cy.contains('Alert Settings').should('be.visible');
      
      // Switch to WhatsApp
      cy.contains('WhatsApp').click();
      cy.contains('WhatsApp').should('have.attr', 'data-state', 'active');
      cy.contains('WhatsApp Alerts Coming Soon').should('be.visible');
      
      // Switch back to webhooks
      cy.contains('Webhooks').click();
      cy.contains('Webhooks').should('have.attr', 'data-state', 'active');
      cy.contains('Add Webhook').should('be.visible');
    });

    it('should handle URL parameters for tab selection', () => {
      // Visit with webhooks tab parameter
      cy.visit('/alerts?tab=webhooks');
      
      // Should start on webhooks tab
      cy.contains('Webhooks').should('have.attr', 'data-state', 'active');
      cy.contains('Add Webhook').should('be.visible');
    });
  });

  describe('WhatsApp Tab', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
      
      // Switch to WhatsApp tab
      cy.contains('WhatsApp').click();
    });

    it('should display WhatsApp coming soon interface', () => {
      // Check for coming soon content
      cy.contains('WhatsApp Alerts Coming Soon').should('be.visible');
      cy.contains('Get instant arbitrage alerts directly on WhatsApp').should('be.visible');
      
      // Check features list
      cy.contains('Direct messages to your WhatsApp').should('be.visible');
      cy.contains('Rich formatting with profit calculations').should('be.visible');
      cy.contains('Instant notifications').should('be.visible');
      cy.contains('One-click setup process').should('be.visible');
    });

    it('should display message preview', () => {
      // Check for message preview
      cy.contains('Message Preview').should('be.visible');
      cy.contains('Arbitrage Alert').should('be.visible');
      cy.contains('Binance → VALR').should('be.visible');
      cy.contains('Spread:').should('be.visible');
    });

    it('should display email signup form', () => {
      // Check for email signup
      cy.contains('Get Notified When It\'s Ready').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.contains('Notify Me').should('be.visible');
      
      // Check privacy notice
      cy.contains('We respect your privacy').should('be.visible');
    });

    it('should handle email signup validation', () => {
      // Try invalid email
      cy.get('input[type="email"]').type('invalid-email');
      cy.contains('Notify Me').click();
      
      // Should show validation error
      cy.contains('Invalid Email').should('be.visible');
    });

    it('should handle successful email signup', () => {
      // Enter valid email
      cy.get('input[type="email"]').type('test@example.com');
      cy.contains('Notify Me').click();
      
      // Should show loading state
      cy.contains('Subscribing...').should('be.visible');
      
      // Should show success message (after simulation)
      cy.contains('Success!', { timeout: 3000 }).should('be.visible');
      cy.contains('You\'ll be notified when WhatsApp alerts are available').should('be.visible');
      
      // Email field should be cleared
      cy.get('input[type="email"]').should('have.value', '');
    });
  });

  describe('Redirect from Old Webhook Route', () => {
    it('should redirect from /webhook-alerts to /alerts?tab=webhooks', () => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      
      // Visit old webhook route
      cy.visit('/webhook-alerts');
      
      // Should redirect to unified alerts with webhooks tab
      cy.url().should('include', '/alerts');
      cy.url().should('include', 'tab=webhooks');
      
      // Should be on webhooks tab
      cy.contains('Webhooks').should('have.attr', 'data-state', 'active');
    });
  });

  describe('Alert Tab Counts', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
    });

    it('should display alert counts in tab labels', () => {
      // Check for alert counts in tab badges
      cy.contains('Webhooks').should('be.visible');
      cy.contains('Browser').should('be.visible');
      
      // Look for badge indicators (may be 0 for new users)
      cy.get('[role="tablist"] span').should('exist');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
    });

    it('should be responsive on mobile viewport', () => {
      cy.viewport('iphone-6');
      
      // Page should still be functional
      cy.contains('Alerts').should('be.visible');
      cy.get('[role="tablist"]').should('be.visible');
      
      // Tabs should be stacked appropriately
      cy.contains('Browser').should('be.visible');
      cy.contains('Webhooks').should('be.visible');
    });

    it('should be responsive on tablet viewport', () => {
      cy.viewport('ipad-2');
      
      // Page should display properly
      cy.contains('Alerts').should('be.visible');
      cy.contains('Manage your arbitrage opportunity notifications').should('be.visible');
      
      // Tab labels should be visible
      cy.contains('Browser').should('be.visible');
      cy.contains('Webhooks').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.login('user', 'user123');
      cy.waitForAuth();
      cy.visit('/alerts');
    });

    it('should handle API errors gracefully', () => {
      // Intercept webhook API calls and force error
      cy.intercept('GET', '/api/webhook-alerts', { statusCode: 500 }).as('webhookError');
      
      cy.contains('Webhooks').click();
      cy.wait('@webhookError');
      
      // Should not break the page
      cy.contains('Webhooks').should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Intercept and fail API calls
      cy.intercept('GET', '/api/alerts', { forceNetworkError: true }).as('networkError');
      
      cy.contains('Browser Alerts').click();
      cy.contains('History').click();
      
      // Page should still be functional
      cy.contains('Alert History').should('be.visible');
    });
  });
});