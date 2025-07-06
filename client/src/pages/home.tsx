import { useState } from 'react';
import ExchangeRateSummary from '@/components/ExchangeRateSummary';
import PriceComparison from '@/components/PriceComparison';
import ArbitrageOpportunities from '@/components/ArbitrageOpportunities';
import AlertNotification from '@/components/AlertNotification';
import TinyLineChart from '@/components/TinyLineChart';
import SpreadBarChart from '@/components/SpreadBarChart';
// import AIAdvisor from '@/components/AIAdvisor';
import HomepageCarousel from '@/components/HomepageCarousel';
import Layout from '@/components/Layout';
import useArbitrageTracker from '@/hooks/useArbitrageTracker';
import useAlerts from '@/hooks/useAlerts';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Badge, useTheme } from '@/components/dark-ui';
import { useLocation } from 'wouter';
import { Bell, BarChart, Crown, CheckCircle } from 'lucide-react';

export default function Home() {
  const { theme } = useTheme();
  
  // Get refresh rate from localStorage or default to 30 seconds
  const [initialRefreshRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedRefreshRate = window.localStorage.getItem("refreshRate");
      return savedRefreshRate ? parseInt(savedRefreshRate) : 30;
    }
    return 30;
  });
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Listen for storage events to update refresh rate when changed in profile page
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const newRefreshRate = window.localStorage.getItem("refreshRate");
        if (newRefreshRate) {
          // This will trigger a rerender of the component
          window.location.reload();
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  const {
    data,
    threshold,
    setThreshold,
    refreshRate,
    setRefreshRate,
    refreshData,
    crossingThreshold
  } = useArbitrageTracker(initialRefreshRate);
  
  const {
    alertHistory,
    options,
    triggerAlert,
    toggleSoundAlerts,
    toggleBrowserNotifications,
    clearAlerts,
    isLoading: alertsLoading
  } = useAlerts();

  // Check for opportunities that cross the threshold and trigger alerts
  useEffect(() => {
    try {
      // Only proceed if user is authenticated, we have valid data and we're not in a loading state
      if (isAuthenticated && Array.isArray(data.opportunities) && !data.loading) {
        // Find opportunities that cross the threshold
        console.log(`Checking opportunities against threshold: ${threshold}%`);
        const thresholdOpportunities = data.opportunities.filter(
          opp => {
            if (opp && typeof opp.spreadPercentage === 'number') {
              const passes = opp.spreadPercentage >= threshold;
              if (passes) {
                console.log(`Found opportunity above threshold: ${opp.spreadPercentage}% >= ${threshold}%`);
              }
              return passes;
            }
            return false;
          }
        );
        
        // Only trigger an alert if we have valid opportunities
        if (thresholdOpportunities.length > 0 && thresholdOpportunities[0]) {
          // Wrap the alert trigger in a try/catch to prevent app crashes
          try {
            triggerAlert(thresholdOpportunities[0]);
          } catch (alertError) {
            console.error('Error triggering alert:', alertError);
          }
        }
      }
    } catch (error) {
      // Global error handler for the entire effect
      console.error('Error in threshold monitoring effect:', error);
    }
  }, [isAuthenticated, data.opportunities, data.loading, threshold, triggerAlert]);

  const mainContent = (
    <>
      {/* Homepage Carousel - Visible at top for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-6">
          <HomepageCarousel />
        </div>
      )}
      
      {/* Top Arbitrage Opportunities Section - Only visible for authenticated users */}
      {isAuthenticated && (
        <div className="mb-6">
          <h2 
            className="text-2xl font-bold flex items-center mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            <BarChart 
              className="h-5 w-5 mr-2" 
              style={{ color: theme.colors.primary.main }}
            />
            Arbitrage Opportunities
          </h2>
          
          {/* Arbitrage Opportunities - Minimal design */}
          <ArbitrageOpportunities 
            opportunities={data.opportunities || []}
            threshold={threshold}
            loading={data.loading}
          />
          
          {/* AI Advisor - Hidden for minimal UI */}
          {/* <AIAdvisor 
            opportunities={data.opportunities || []}
            isLoading={data.loading}
          /> */}
        </div>
      )}
      
      {/* Spread Trends - Minimal design, no container */}
      {isAuthenticated && (
        <TinyLineChart />
      )}
      
      {!isAuthenticated && (
        <Card 
          className="mb-6"
          style={{
            background: `linear-gradient(to right, ${theme.colors.primary.main}20, ${theme.colors.primary.main}30)`,
            borderColor: theme.colors.primary.main
          }}
        >
          <div className="flex items-center mb-3">
            <Crown className="h-6 w-6 mr-2" style={{ color: '#F59E0B' }} />
            <h3 
              className="text-lg md:text-xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              Unlock Premium Features
            </h3>
          </div>
          <p 
            className="text-sm md:text-base mb-4"
            style={{ color: theme.colors.text.secondary }}
          >
            Join thousands of traders maximizing their arbitrage profits with our comprehensive suite of premium tools
          </p>
          
          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              'Real-time arbitrage opportunities',
              'Advanced profit calculator', 
              'Browser push notifications',
              'Webhook alert integrations',
              'Trade journal & analytics',
              'Historical spread data',
              'Multi-exchange monitoring',
              'Customizable alert thresholds'
            ].map((feature) => (
              <div 
                key={feature}
                className="flex items-center space-x-2 text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                <CheckCircle className="h-4 w-4" style={{ color: '#10B981' }} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          <div 
            className="rounded-lg p-4 border mb-4"
            style={{
              backgroundColor: `${theme.colors.background.elevated}`,
              borderColor: theme.colors.border.primary
            }}
          >
            <p 
              className="text-center font-semibold mb-3"
              style={{ color: theme.colors.text.primary }}
            >
              Start maximizing your crypto arbitrage profits today!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/register')}
                variant="primary"
                className="font-medium px-6 py-2"
                data-testid="get-started-button"
              >
                Get Started Free
              </Button>
              <Button 
                onClick={() => setLocation('/login')}
                variant="outline"
                className="font-medium px-6 py-2"
                data-testid="sign-in-button"
              >
                Sign In
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p 
              className="text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              Join 10,000+ traders already using our platform
            </p>
          </div>
        </Card>
      )}
      
      {/* Exchange Rate Summary and Visual Spread Comparison side by side */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Exchange Rate Summary */}
          <Card>
            <ExchangeRateSummary 
              exchangeRate={data.exchangeRate || { rate: 19.0, timestamp: new Date().toISOString() }}
              bestOpportunity={data.bestOpportunity}
              potentialProfit={data.potentialProfit}
              loading={data.loading}
            />
          </Card>
          
          {/* Visual Spread Comparison */}
          <Card className="flex flex-col h-full">
            <div className="mb-2">
              <h3 
                className="text-base md:text-lg font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                Visual Spread Comparison
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                Real-time arbitrage rates and profit indicators
              </p>
            </div>
            <div className="flex-grow" style={{ minHeight: "300px" }}>
              <SpreadBarChart 
                opportunities={data.opportunities || []}
                loading={data.loading}
              />
            </div>
          </Card>
        </div>
      )}
      
      {/* Exchange Rate Summary for non-authenticated users */}
      {!isAuthenticated && (
        <Card className="mb-6">
          <ExchangeRateSummary 
            exchangeRate={data.exchangeRate || { rate: 19.0, timestamp: new Date().toISOString() }}
            bestOpportunity={data.bestOpportunity}
            potentialProfit={data.potentialProfit}
            loading={data.loading}
          />
        </Card>
      )}
      
      <PriceComparison 
        internationalExchanges={data.internationalExchanges || []}
        localExchanges={data.localExchanges || []}
        loading={data.loading}
      />
      
      {/* Homepage Carousel - Positioned above Alert Management for authenticated users */}
      {isAuthenticated && (
        <div className="mb-6">
          <HomepageCarousel />
        </div>
      )}

      {/* Alert Management Section */}
      {isAuthenticated && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              Alert Management
            </h2>
          </div>
          <p 
            className="text-sm mb-4"
            style={{ color: theme.colors.text.secondary }}
          >
            Alert settings and history have been moved to a dedicated page for better organization.
            Visit the Alerts page to configure your notification preferences and view your alert history.
          </p>
          <Button 
            onClick={() => setLocation('/alerts')}
            className="flex items-center"
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            <span>Go to Alerts Page</span>
          </Button>
        </Card>
      )}
      
      {isAuthenticated && (
        <AlertNotification 
          visible={(crossingThreshold === true) || false}
          opportunity={
            Array.isArray(data.opportunities) && 
            data.opportunities.length > 0 && 
            data.opportunities[0] ? 
              data.opportunities[0] : null
          }
        />
      )}
      
      {/* Alert will float above content when visible */}
    </>
  );

  return (
    <Layout
      headerOptions={{
        refreshRate,
        setRefreshRate,
        refreshData,
        isLoading: data.loading
      }}
    >
      {mainContent}
    </Layout>
  );
}