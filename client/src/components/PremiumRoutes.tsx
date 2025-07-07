import SubscriptionGuard from '@/components/SubscriptionGuard';
import UnifiedAlertsPage from '@/pages/alerts-unified';
import CalculatorPage from '@/pages/calculator';
import TradeJournalPage from '@/pages/trade-journal';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Protected premium route components with automatic redirection
export function ProtectedAlerts() {
  return (
    <SubscriptionGuard featureName="Arbitrage Alerts" redirectToPremium={true}>
      <UnifiedAlertsPage />
    </SubscriptionGuard>
  );
}

// Redirect component for old webhook alerts route
export function WebhookAlertsRedirect() {
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/alerts?tab=webhooks');
  }, [setLocation]);
  
  return null;
}

export function ProtectedCalculator() {
  return (
    <SubscriptionGuard featureName="Advanced Calculator" redirectToPremium={true}>
      <CalculatorPage />
    </SubscriptionGuard>
  );
}

export function ProtectedTradeJournal() {
  return (
    <SubscriptionGuard featureName="Trade Journal" redirectToPremium={true}>
      <TradeJournalPage />
    </SubscriptionGuard>
  );
}