/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>
      adminLogin(username: string, password: string): Chainable<void>
      waitForAuth(): Chainable<void>
      logout(): Chainable<void>
      debugAuth(): Chainable<void>
      retryLogin(username: string, password: string, maxRetries?: number): Chainable<void>
      resetSession(): Chainable<void>
    }
  }
}

// Enhanced login command with proper session/token handling
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.log(`Attempting login with username: ${username}`);
  
  // Visit login page first to establish session
  cy.visit('/login');
  
  // Get CSRF token while maintaining session cookies
  cy.getCookie('arb.sid').then((sessionCookie) => {
    cy.log(`Session cookie exists: ${sessionCookie ? 'yes' : 'no'}`);
    
    cy.request({
      method: 'GET',
      url: '/api/csrf-token',
      headers: {
        'Accept': 'application/json'
      }
    }).then((csrfResponse) => {
      const csrfToken = csrfResponse.body.csrfToken;
      cy.log(`Obtained CSRF token: ${csrfToken.substring(0, 10)}...`);
      
      // Perform login via API with the same session
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { username, password },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        failOnStatusCode: false
      }).then((loginResponse) => {
        cy.log(`Login response status: ${loginResponse.status}`);
        
        if (loginResponse.status === 200) {
          cy.log('Login successful via API');
          cy.log(`User authenticated: ${JSON.stringify(loginResponse.body)}`);
        
        // For admin users, store the admin token if provided
        if (loginResponse.body.adminToken) {
          cy.window().then((window) => {
            window.localStorage.setItem('adminToken', loginResponse.body.adminToken.token);
            cy.log('Admin token stored in localStorage');
          });
        }
        
        // Wait a moment for session to be saved
        cy.wait(500);
        
        // Verify authentication status with session
        cy.request({
          method: 'GET',
          url: '/api/auth/user',
          failOnStatusCode: false
        }).then((userResponse) => {
          cy.log(`Auth verification status: ${userResponse.status}`);
          if (userResponse.status === 200) {
            cy.log(`Authentication verified: ${JSON.stringify(userResponse.body)}`);
          } else {
            cy.log(`Warning: Authentication verification failed: ${JSON.stringify(userResponse.body)}`);
          }
        });
        
      } else {
        cy.log(`Login failed with status: ${loginResponse.status}`);
        cy.log(`Login error response: ${JSON.stringify(loginResponse.body)}`);
        throw new Error(`Login failed: ${loginResponse.body?.message || loginResponse.body?.error?.message || 'Unknown error'}`);
        }
      });
    });
  });
});

// Admin-specific login command
Cypress.Commands.add('adminLogin', (username: string, password: string) => {
  cy.log(`Attempting admin login with username: ${username}`);
  
  // Use the regular login first
  cy.login(username, password);
  
  // Additional verification for admin access
  cy.window().then((window) => {
    const adminToken = window.localStorage.getItem('adminToken');
    
    if (adminToken) {
      // Verify the stored admin token
      cy.request({
        method: 'GET',
        url: '/api/auth/verify-admin-token',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          cy.log('Admin token verified successfully');
        } else {
          cy.log('Admin token verification failed, trying session conversion...');
          // Try session-to-token conversion
          cy.request({
            method: 'GET',
            url: '/api/auth/session-to-token',
            failOnStatusCode: false
          }).then((tokenResponse) => {
            if (tokenResponse.status === 200 && tokenResponse.body.token) {
              window.localStorage.setItem('adminToken', tokenResponse.body.token);
              cy.log('Admin token obtained via session conversion');
            }
          });
        }
      });
    } else {
      cy.log('No admin token found, trying session conversion...');
      // Try session-to-token conversion
      cy.request({
        method: 'GET',
        url: '/api/auth/session-to-token',
        failOnStatusCode: false
      }).then((tokenResponse) => {
        if (tokenResponse.status === 200 && tokenResponse.body.token) {
          window.localStorage.setItem('adminToken', tokenResponse.body.token);
          cy.log('Admin token obtained via session conversion');
        }
      });
    }
  });
});

// Utility command to wait for authentication state
Cypress.Commands.add('waitForAuth', () => {
  cy.log('Waiting for authentication state to be stable...');
  
  // Wait for the auth context to load
  cy.get('body', { timeout: 10000 }).should('exist');
  
  // Give auth context time to process
  cy.wait(1000);
  
  // Verify auth APIs are responsive
  cy.request({
    method: 'GET',
    url: '/api/auth/user',
    failOnStatusCode: false
  }).then((response) => {
    cy.log(`Authentication check complete. Status: ${response.status}`);
  });
});

// Command to clear authentication state
Cypress.Commands.add('logout', () => {
  cy.log('Clearing authentication state...');
  
  // Clear localStorage completely
  cy.window().then((window) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    cy.log('Cleared all localStorage and sessionStorage');
  });
  
  // Clear all cookies
  cy.clearCookies();
  cy.log('Cleared all cookies');
  
  // Call logout API to clear server-side session
  cy.request({
    method: 'POST',
    url: '/api/auth/logout',
    failOnStatusCode: false
  }).then(() => {
    cy.log('Logout API called');
  });
  
  // Clear any browser session/cache
  cy.clearLocalStorage();
  
  // Wait for logout to complete
  cy.wait(500);
  
  // Verify logout by checking auth status
  cy.request({
    method: 'GET',
    url: '/api/auth/user',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 401 || response.status === 403) {
      cy.log('Session successfully cleared - user is logged out');
    } else {
      cy.log(`Warning: Logout may not have completed fully. Status: ${response.status}`);
    }
  });
});

// Debug command to check authentication state
Cypress.Commands.add('debugAuth', () => {
  cy.log('=== AUTHENTICATION DEBUG ===');
  
  // Check localStorage
  cy.window().then((window) => {
    const adminToken = window.localStorage.getItem('adminToken');
    cy.log(`LocalStorage adminToken: ${adminToken ? 'present' : 'not found'}`);
  });
  
  // Check session auth
  cy.request({
    method: 'GET',
    url: '/api/auth/user',
    failOnStatusCode: false
  }).then((response) => {
    cy.log(`Session auth status: ${response.status}`);
    if (response.body) {
      cy.log(`User data: ${JSON.stringify(response.body)}`);
    }
  });
  
  // Check admin token if available
  cy.window().then((window) => {
    const adminToken = window.localStorage.getItem('adminToken');
    if (adminToken) {
      cy.request({
        method: 'GET',
        url: '/api/auth/verify-admin-token',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`Admin token verification: ${response.status}`);
      });
    }
  });
  
  cy.log('=== END AUTH DEBUG ===');
});

// Add retry mechanism for flaky authentication
Cypress.Commands.add('retryLogin', (username: string, password: string, maxRetries: number = 3) => {
  let attempt = 1;
  
  const attemptLogin = () => {
    cy.log(`Login attempt ${attempt}/${maxRetries}`);
    
    cy.login(username, password).then(() => {
      // Verify the login worked
      cy.request({
        method: 'GET',
        url: '/api/auth/user',
        failOnStatusCode: false
      }).then((response) => {
        if (response.status !== 200 && attempt < maxRetries) {
          attempt++;
          cy.log(`Login verification failed, retrying...`);
          cy.wait(1000); // Brief delay before retry
          attemptLogin();
        } else if (response.status !== 200) {
          throw new Error(`Login failed after ${maxRetries} attempts`);
        } else {
          cy.log('Login successful and verified');
        }
      });
    });
  };
  
  attemptLogin();
});

// Complete session reset command for test isolation
Cypress.Commands.add('resetSession', () => {
  cy.log('=== RESETTING SESSION FOR TEST ISOLATION ===');
  
  // Step 1: Complete logout
  cy.logout();
  
  // Step 2: Visit a neutral page to clear any residual state
  cy.visit('/');
  
  // Step 3: Force clear all browser state
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
  
  // Step 4: Clear any cached requests
  cy.window().then((window) => {
    // Clear any potential cached responses
    if ('caches' in window) {
      window.caches.keys().then((names) => {
        names.forEach((name) => {
          window.caches.delete(name);
        });
      });
    }
  });
  
  // Step 5: Verify clean state
  cy.request({
    method: 'GET',
    url: '/api/auth/user',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 401 || response.status === 403) {
      cy.log('✓ Session completely reset - no authentication present');
    } else {
      cy.log(`⚠ Warning: Session reset may be incomplete. Auth status: ${response.status}`);
    }
  });
  
  // Wait for reset to fully complete
  cy.wait(1000);
  
  cy.log('=== SESSION RESET COMPLETE ===');
});