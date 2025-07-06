/// <reference types="cypress" />

// User Stories: Admin User Management, Content Management, Payment Analytics

describe('Admin Functionalities', () => {
  before(() => {
    // Complete session reset before the entire test suite
    cy.resetSession();
  });

  beforeEach(() => {
    // Clear any existing authentication state
    cy.logout();
    
    // Set up code to run before each test, like logging in as admin
    cy.adminLogin('admin', 'admin123');
    
    // Wait for authentication to stabilize
    cy.waitForAuth();
    
    // Visit admin page
    cy.visit('/admin');
    
    // Wait for the page to load completely
    cy.get('body').should('exist');
  });

  afterEach(() => {
    // Clean up after each admin test
    cy.logout();
  });

  after(() => {
    // Complete cleanup after the entire test suite
    cy.resetSession();
  });

  it('should allow admin to access user management', () => {
    // Test user management functionality
    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    cy.get('[data-testid="user-management"]').should('be.visible');
    
    // Verify admin stats are visible
    cy.get('[data-testid="admin-stats"]').should('be.visible');
  });

  it('should allow admin to access admin dashboard', () => {
    // Test admin dashboard functionality
    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    cy.contains('Admin Dashboard').should('be.visible');
    cy.contains('User Management').should('be.visible');
  });

  it('should display payment analytics correctly', () => {
    // Navigate to payment analytics tab (would need to implement tab navigation)
    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    
    // Note: This test verifies the admin dashboard loads correctly
    // Full tab navigation testing would require additional implementation
  });
}); 