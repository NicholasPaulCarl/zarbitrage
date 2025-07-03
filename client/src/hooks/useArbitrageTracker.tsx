import { useState, useEffect, useCallback } from 'react';
import { ArbitrageData, Exchange, ExchangeRate, ArbitrageOpportunity } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function useArbitrageTracker(refreshInterval: number) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // Initialize threshold from localStorage or default to 3.0
  const [threshold, setThreshold] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedThreshold = window.localStorage.getItem("alertThreshold");
      return savedThreshold ? parseFloat(savedThreshold) : 3.0;
    }
    return 3.0;
  });
  
  const [refreshRate, setRefreshRate] = useState<number>(refreshInterval || 30);
  
  // Update refreshRate in localStorage when changed
  const updateRefreshRate = useCallback((rate: number) => {
    setRefreshRate(rate);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('refreshRate', rate.toString());
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'));
    }
  }, []);
  
  // Update threshold in localStorage when changed
  const updateThreshold = useCallback((newThreshold: number) => {
    setThreshold(newThreshold);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('alertThreshold', newThreshold.toString());
      console.log(`Alert threshold set to ${newThreshold}%`);
    }
  }, []);

  // Query for exchange rate data
  const exchangeRateQuery = useQuery({
    queryKey: ['/api/exchange-rate'],
    staleTime: refreshRate * 1000
  });

  // Query for international exchange prices
  const internationalPricesQuery = useQuery({
    queryKey: ['/api/prices/international'],
    staleTime: refreshRate * 1000
  });

  // Query for local exchange prices
  const localPricesQuery = useQuery({
    queryKey: ['/api/prices/local'],
    staleTime: refreshRate * 1000
  });

  // Query for arbitrage opportunities
  const arbitrageQuery = useQuery({
    queryKey: ['/api/arbitrage'],
    staleTime: refreshRate * 1000
  });

  // Derive loading and error states
  const isLoading = 
    exchangeRateQuery.isLoading || 
    internationalPricesQuery.isLoading || 
    localPricesQuery.isLoading ||
    arbitrageQuery.isLoading;

  const error = 
    exchangeRateQuery.error?.message || 
    internationalPricesQuery.error?.message || 
    localPricesQuery.error?.message ||
    arbitrageQuery.error?.message || 
    null;

  // Function to refresh all data
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/exchange-rate'] });
    queryClient.invalidateQueries({ queryKey: ['/api/prices/international'] });
    queryClient.invalidateQueries({ queryKey: ['/api/prices/local'] });
    queryClient.invalidateQueries({ queryKey: ['/api/arbitrage'] });
  }, [queryClient]);

  // Setup auto-refresh interval with performance optimization
  useEffect(() => {
    // Only auto-refresh if user is authenticated and data is actually being used
    if (!isAuthenticated) {
      return;
    }

    const intervalId = setInterval(() => {
      // Only refresh if the page is visible to save bandwidth and server resources
      if (!document.hidden) {
        refreshData();
      }
    }, refreshRate * 1000);

    return () => clearInterval(intervalId);
  }, [refreshRate, refreshData, isAuthenticated]);

  // Check for threshold crossing opportunities with proper error handling
  const crossingThreshold = (() => {
    try {
      // Make sure we have valid data before checking
      if (Array.isArray(arbitrageQuery.data)) {
        return arbitrageQuery.data.some(
          (opp: ArbitrageOpportunity) => 
            opp && typeof opp.spreadPercentage === 'number' && opp.spreadPercentage >= threshold
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking for threshold crossing:', error);
      return false;
    }
  })();

  // Find the best arbitrage opportunity with error handling
  const bestOpportunity = (() => {
    try {
      // Safely access the first item in the array if it exists
      if (Array.isArray(arbitrageQuery.data) && arbitrageQuery.data.length > 0) {
        return arbitrageQuery.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding best opportunity:', error);
      return null;
    }
  })();

  // Calculate potential profit for 1 BTC with error handling
  const potentialProfit = (() => {
    try {
      return bestOpportunity && typeof bestOpportunity.spread === 'number' ? bestOpportunity.spread : 0;
    } catch (error) {
      console.error('Error calculating potential profit:', error);
      return 0;
    }
  })();

  // Calculate USD equivalent prices for ZAR exchanges with error handling
  const localExchangesWithUsdEquivalent = (() => {
    try {
      if (Array.isArray(localPricesQuery.data) && localPricesQuery.data.length > 0) {
        return localPricesQuery.data.map((exchange: Exchange) => {
          try {
            const exchangeRateData = exchangeRateQuery.data as ExchangeRate;
            const rate = exchangeRateData?.rate || 19.0;
            if (exchange && typeof exchange.price === 'number' && rate > 0) {
              return {
                ...exchange,
                usdEquivalent: exchange.price / rate
              };
            }
            return { ...exchange, usdEquivalent: undefined };
          } catch (mapError) {
            console.error('Error calculating USD equivalent:', mapError);
            return { ...exchange, usdEquivalent: undefined };
          }
        });
      }
      return [];
    } catch (error) {
      console.error('Error processing local exchanges:', error);
      return [];
    }
  })();

  // Calculate ZAR equivalent prices for USD exchanges with error handling
  const internationalExchangesWithZarEquivalent = (() => {
    try {
      if (Array.isArray(internationalPricesQuery.data) && internationalPricesQuery.data.length > 0) {
        return internationalPricesQuery.data.map((exchange: Exchange) => {
          try {
            const exchangeRateData = exchangeRateQuery.data as ExchangeRate;
            const rate = exchangeRateData?.rate || 19.0;
            if (exchange && typeof exchange.price === 'number' && rate > 0) {
              return {
                ...exchange,
                zarEquivalent: exchange.price * rate
              };
            }
            return { ...exchange, zarEquivalent: undefined };
          } catch (mapError) {
            console.error('Error calculating ZAR equivalent:', mapError);
            return { ...exchange, zarEquivalent: undefined };
          }
        });
      }
      return [];
    } catch (error) {
      console.error('Error processing international exchanges:', error);
      return [];
    }
  })();

  return {
    data: {
      exchangeRate: exchangeRateQuery.data as ExchangeRate,
      internationalExchanges: internationalExchangesWithZarEquivalent,
      localExchanges: localExchangesWithUsdEquivalent,
      opportunities: arbitrageQuery.data as ArbitrageOpportunity[],
      bestOpportunity,
      potentialProfit,
      lastUpdated: new Date().toISOString(),
      loading: isLoading,
      error
    },
    threshold,
    setThreshold: updateThreshold,
    refreshRate,
    setRefreshRate: updateRefreshRate,
    refreshData,
    crossingThreshold
  };
}
