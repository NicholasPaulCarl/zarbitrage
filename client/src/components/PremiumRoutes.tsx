import SubscriptionGuard from '@/components/SubscriptionGuard';
import AlertsPage from '@/pages/alerts';
import WebhookAlertsPage from '@/pages/webhook-alerts';
import CalculatorPage from '@/pages/calculator';
import TradeJournalPage from '@/pages/trade-journal';

// Protected premium route components with automatic redirection
export function ProtectedAlerts() {
  return (
    <SubscriptionGuard featureName="Browser Alerts" redirectToPremium={true}>
      <AlertsPage />
    </SubscriptionGuard>
  );
}

export function ProtectedWebhookAlerts() {
  return (
    <SubscriptionGuard featureName="Webhook Alerts" redirectToPremium={true}>
      <WebhookAlertsPage />
    </SubscriptionGuard>
  );
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