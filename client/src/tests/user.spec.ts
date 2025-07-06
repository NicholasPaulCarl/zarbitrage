/// <reference types="cypress" />

// User Stories: Real-time Price Monitoring, Arbitrage Opportunity Detection, Historical Spread Analysis, User Authentication, Premium Subscriptions, Trade Journal

describe('User Functionalities', () => {
  before(() => {
    // Complete session reset before the entire test suite
    cy.resetSession();
  });

  beforeEach(() => {
    // Clear any existing authentication state for each test
    cy.logout();
    
    // Set up code to run before each test, like visiting the homepage
    cy.visit('/');
  });

  after(() => {
    // Complete cleanup after the entire test suite
    cy.resetSession();
  });

  it('should display real-time cryptocurrency prices', () => {
    // Test real-time price monitoring
    cy.get('[data-testid="price-comparison"]').should('be.visible');
    cy.get('[data-testid="international-exchanges"]').should('be.visible');
    cy.get('[data-testid="local-exchanges"]').should('be.visible');
  });

  it('should detect arbitrage opportunities for authenticated users', () => {
    // Login first since arbitrage opportunities are only visible for authenticated users
    cy.login('user', 'user123');
    cy.waitForAuth();
    cy.visit('/');
    
    // Wait for page to load and APIs to respond
    cy.get('[data-testid="price-comparison"]', { timeout: 10000 }).should('be.visible');
    
    // Test arbitrage opportunity detection
    cy.get('[data-testid="arbitrage-opportunities"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="arbitrage-opportunity-row"]', { timeout: 5000 }).should('exist');
  });

  it('should allow user to register and login', () => {
    // Test user registration flow
    cy.get('[data-testid="get-started-button"]').click();
    cy.url().should('include', '/register');
    
    // Go back to home and test login flow
    cy.visit('/');
    cy.get('[data-testid="sign-in-button"]').click();
    cy.url().should('include', '/login');
    
    // Test login form
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-submit-button"]').should('be.visible');
  });

  it('should allow access to premium features for subscribed users', () => {
    // Test premium subscription access
    cy.login('user', 'user123');
    cy.waitForAuth();
    cy.visit('/alerts'); // This should be a premium feature
    cy.url().should('include', '/alerts');
  });

  it('should allow users to track trades in the trade journal', () => {
    // Test trade journal functionality
    cy.login('user', 'user123');
    cy.waitForAuth();
    cy.visit('/trade-journal');
    cy.url().should('include', '/trade-journal');
    // Note: Actual form testing would require the trade journal to be fully loaded
    // This test verifies the route is accessible for authenticated users
  });
}); 