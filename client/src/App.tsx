import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import TreeMap from "@/pages/treemap";
import Admin from "@/pages/admin";
import FeatureRequests from "@/pages/feature-requests";
import { ProtectedAlerts, ProtectedWebhookAlerts, ProtectedCalculator, ProtectedTradeJournal } from "@/components/PremiumRoutes";
import Premium from "@/pages/premium";
import DebugPage from "@/pages/debug";
import AdminBypassPage from "@/pages/admin-bypass";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminTokenDebugPage from "@/pages/admin-token-debug";
import TokenDebug from "@/pages/token-debug";
import AdminDebugPage from "@/pages/admin-debug";
import AdminLogin from "@/pages/admin-login";
import AdminTest from "@/pages/admin-test";
import AdminPaymentAnalyticsNew from "@/pages/admin-payment-analytics-new";
import AdminPaymentAnalyticsUnified from "@/pages/admin-payment-analytics-unified";
import AdminCarousel from "@/pages/admin-carousel";
import UILibrary from "@/pages/ui-library";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/alerts" component={ProtectedAlerts} />
      <Route path="/webhook-alerts" component={ProtectedWebhookAlerts} />
      <Route path="/calculator" component={ProtectedCalculator} />
      <Route path="/profile" component={Profile} />
      <Route path="/treemap" component={TreeMap} />
      <Route path="/feature-requests" component={FeatureRequests} />
      <Route path="/premium" component={Premium} />
      <Route path="/trade-journal" component={ProtectedTradeJournal} />
      <Route path="/ui-library" component={UILibrary} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/admin-dashboard" component={AdminDashboardPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/auth" component={AdminLogin} />
      <Route path="/admin-bypass" component={AdminBypassPage} />
      <Route path="/admin-token-debug" component={AdminTokenDebugPage} />
      <Route path="/admin-debug" component={AdminDebugPage} />
      <Route path="/admin-carousel" component={AdminCarousel} />
      <Route path="/admin-payment-analytics-unified" component={AdminPaymentAnalyticsUnified} />
      <Route path="/admin-payment-analytics" component={AdminPaymentAnalyticsNew} />
      <Route path="/admin-test" component={AdminTest} />
      <Route path="/token-debug" component={TokenDebug} />
      <Route path="/debug" component={DebugPage} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
