import { useState } from 'react';
import ExchangeRateSummary from '@/components/ExchangeRateSummary';
import PriceComparison from '@/components/PriceComparison';
import ArbitrageOpportunities from '@/components/ArbitrageOpportunities';
import AlertNotification from '@/components/AlertNotification';
import TinyLineChart from '@/components/TinyLineChart';
import SpreadBarChart from '@/components/SpreadBarChart';
import AIAdvisor from '@/components/AIAdvisor';
import HomepageCarousel from '@/components/HomepageCarousel';
import Layout from '@/components/Layout';
import useArbitrageTracker from '@/hooks/useArbitrageTracker';
import useAlerts from '@/hooks/useAlerts';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Bell, BarChart, Crown, CheckCircle } from 'lucide-react';

export default function Home() {
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
          <h2 className="text-2xl font-bold flex items-center mb-2">
            <BarChart className="h-5 w-5 mr-2 text-primary" />
            Arbitrage Opportunities
          </h2>
          
          {/* Top 5 Arbitrage Opportunities in its own row */}
          <div className="bg-white p-4 rounded flex flex-col h-full mb-4">
            <div className="flex-grow overflow-auto">
              <ArbitrageOpportunities 
                opportunities={data.opportunities || []}
                threshold={threshold}
                loading={data.loading}
              />
            </div>
          </div>
          
          {/* AI Advisor - Added below Arbitrage Opportunities */}
          <AIAdvisor 
            opportunities={data.opportunities || []}
            isLoading={data.loading}
          />
        </div>
      )}
      
      {/* Spread Trends (renamed from Monthly Spread Trends) */}
      {isAuthenticated && (
        <div className="mb-6">
          <TinyLineChart />
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center mb-3">
            <Crown className="h-6 w-6 text-amber-500 mr-2" />
            <h3 className="text-lg md:text-xl font-bold text-blue-800">Unlock Premium Features</h3>
          </div>
          <p className="text-sm md:text-base text-blue-700 mb-4">
            Join thousands of traders maximizing their arbitrage profits with our comprehensive suite of premium tools
          </p>
          
          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Real-time arbitrage opportunities</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Advanced profit calculator</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Browser push notifications</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Webhook alert integrations</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Trade journal & analytics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Historical spread data</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Multi-exchange monitoring</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Customizable alert thresholds</span>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-4 border border-blue-300/50 mb-4">
            <p className="text-center text-blue-800 font-semibold mb-3">
              Start maximizing your crypto arbitrage profits today!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/register')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2"
                data-testid="get-started-button"
              >
                Get Started Free
              </Button>
              <Button 
                onClick={() => setLocation('/login')}
                variant="outline"
                className="border-blue-500 text-blue-700 hover:bg-blue-50 font-medium px-6 py-2"
                data-testid="sign-in-button"
              >
                Sign In
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-blue-600">
              Join 10,000+ traders already using our platform
            </p>
          </div>
        </div>
      )}
      
      {/* Exchange Rate Summary and Visual Spread Comparison side by side */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Exchange Rate Summary */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <ExchangeRateSummary 
              exchangeRate={data.exchangeRate || { rate: 19.0, timestamp: new Date().toISOString() }}
              bestOpportunity={data.bestOpportunity}
              potentialProfit={data.potentialProfit}
              loading={data.loading}
            />
          </div>
          
          {/* Visual Spread Comparison */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="mb-2">
              <h3 className="text-base md:text-lg font-medium">Visual Spread Comparison</h3>
              <p className="text-sm text-gray-500">
                Real-time arbitrage rates and profit indicators
              </p>
            </div>
            <div className="flex-grow" style={{ minHeight: "300px" }}>
              <SpreadBarChart 
                opportunities={data.opportunities || []}
                loading={data.loading}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Exchange Rate Summary for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <ExchangeRateSummary 
            exchangeRate={data.exchangeRate || { rate: 19.0, timestamp: new Date().toISOString() }}
            bestOpportunity={data.bestOpportunity}
            potentialProfit={data.potentialProfit}
            loading={data.loading}
          />
        </div>
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
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Alert Management</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
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
        </div>
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