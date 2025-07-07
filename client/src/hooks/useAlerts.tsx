import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArbitrageOpportunity, AlertHistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AlertOptions {
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
}

// Alert history query key for consistent references
const ALERTS_QUERY_KEY = ['/api/alerts'];

export default function useAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [options, setOptions] = useState<AlertOptions>({
    soundEnabled: true,
    browserNotificationEnabled: true
  });
  
  // Store locally cached alerts to prevent unnecessary server requests
  const [cachedAlerts, setCachedAlerts] = useState<AlertHistoryItem[]>([]);
  
  // Debounce mechanism to prevent alert flooding
  const [lastAlertTimestamp, setLastAlertTimestamp] = useState<number>(0);
  const MIN_ALERT_INTERVAL = 3000; // Minimum time between alerts in milliseconds

  // Query for alert history with optimization settings
  const alertHistoryQuery = useQuery<AlertHistoryItem[], Error>({
    queryKey: ALERTS_QUERY_KEY,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false
  });
  
  // Update cached alerts when query data changes
  useEffect(() => {
    if (Array.isArray(alertHistoryQuery.data)) {
      setCachedAlerts(alertHistoryQuery.data);
    }
  }, [alertHistoryQuery.data]);

  // Mutation for adding an alert with optimistic updates
  const addAlertMutation = useMutation({
    mutationFn: async (alert: { route: string; spread: number; spreadPercentage: number }) => {
      return await apiRequest('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    },
    onMutate: (newAlertData) => {
      // Create an optimistic alert with temporary ID
      const optimisticAlert: AlertHistoryItem = {
        id: Date.now(),
        route: newAlertData.route,
        spread: newAlertData.spread,
        spreadPercentage: newAlertData.spreadPercentage,
        timestamp: new Date().toISOString()
      };
      
      // Update the cached alerts state immediately
      setCachedAlerts(currentAlerts => [optimisticAlert, ...currentAlerts]);
      
      return { optimisticAlert };
    },
    onError: (error) => {
      console.error('Error adding alert:', error);
      // On error, refresh from server to ensure data consistency
      alertHistoryQuery.refetch();
    },
    onSuccess: (newAlert: AlertHistoryItem) => {
      // Update cached alerts with the confirmed server data
      setCachedAlerts(currentAlerts => {
        // Replace optimistic entry or add the new alert
        return [
          newAlert,
          ...currentAlerts.filter(alert => 
            // Remove any optimistic entry that matches this alert
            !(alert.route === newAlert.route && 
              Math.abs(alert.spread - newAlert.spread) < 0.01 && 
              Math.abs(alert.spreadPercentage - newAlert.spreadPercentage) < 0.01)
          )
        ];
      });
    }
  });

  // Mutation for clearing all alerts
  const clearAlertsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/alerts', {
        method: 'DELETE'
      });
    },
    onMutate: () => {
      // Optimistically clear alerts
      setCachedAlerts([]);
    },
    onError: (error) => {
      console.error('Error clearing alerts:', error);
      // On error, refresh from server
      alertHistoryQuery.refetch();
    },
    onSuccess: () => {
      toast({
        title: "Alert history cleared",
        description: "All alerts have been removed from history"
      });
    }
  });

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window) || !options.browserNotificationEnabled) {
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }
    
    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
      }
    }
    
    return false;
  }, [options.browserNotificationEnabled]);

  // Request permission when browser notifications are enabled
  useEffect(() => {
    if (options.browserNotificationEnabled) {
      requestNotificationPermission();
    }
  }, [options.browserNotificationEnabled, requestNotificationPermission]);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (!options.soundEnabled) return;
    
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
      });
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Failed to play alert sound:', error);
        });
      }
    } catch (error) {
      console.error('Failed to create audio element:', error);
    }
  }, [options.soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback((opportunity: ArbitrageOpportunity) => {
    if (!options.browserNotificationEnabled || !("Notification" in window)) {
      return;
    }
    
    try {
      if (Notification.permission === "granted") {
        const notification = new Notification('Arbitrage opportunity!', {
          body: `${opportunity.route}: ${opportunity.spreadPercentage.toFixed(2)}% spread detected`,
          icon: '/favicon.ico'
        });
        
        notification.onerror = () => {
          console.error('Browser notification failed to display');
        };
        
        setTimeout(() => notification.close(), 8000);
      } else if (Notification.permission !== "denied") {
        requestNotificationPermission();
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [options.browserNotificationEnabled, requestNotificationPermission]);

  // Trigger alert for opportunity with debouncing
  const triggerAlert = useCallback((opportunity: ArbitrageOpportunity) => {
    // Validate opportunity data
    if (!opportunity?.route || typeof opportunity.spreadPercentage !== 'number' || typeof opportunity.spread !== 'number') {
      console.error('Invalid opportunity data:', opportunity);
      return;
    }
    
    // Apply debouncing
    const now = Date.now();
    if (now - lastAlertTimestamp < MIN_ALERT_INTERVAL) {
      console.log('Alert debounced: too many alerts in short time');
      return;
    }
    
    // Update debounce timestamp
    setLastAlertTimestamp(now);
    
    // Show enhanced toast notification
    toast({
      title: "🚨 Arbitrage Opportunity Detected!",
      description: `${opportunity.route}: ${opportunity.spreadPercentage.toFixed(2)}% spread (${opportunity.spread ? `R${opportunity.spread.toLocaleString()}` : 'Profit'})`,
      variant: "default",
      duration: 5000
    });
    
    // Trigger other notifications
    playAlertSound();
    showBrowserNotification(opportunity);
    
    // Add to history with proper error handling
    try {
      addAlertMutation.mutate({
        route: opportunity.route,
        spread: opportunity.spread,
        spreadPercentage: opportunity.spreadPercentage
      }, {
        onError: (error) => {
          console.error('Failed to save alert to history:', error);
        }
      });
    } catch (error) {
      console.error('Synchronous error in alert mutation:', error);
    }
  }, [
    toast, 
    playAlertSound, 
    showBrowserNotification, 
    addAlertMutation, 
    lastAlertTimestamp
  ]);

  // Toggle sound alerts
  const toggleSoundAlerts = useCallback((enabled: boolean) => {
    setOptions(prev => ({ ...prev, soundEnabled: enabled }));
  }, []);

  // Toggle browser notifications
  const toggleBrowserNotifications = useCallback((enabled: boolean) => {
    setOptions(prev => ({ ...prev, browserNotificationEnabled: enabled }));
    if (enabled) {
      requestNotificationPermission();
    }
  }, [requestNotificationPermission]);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    clearAlertsMutation.mutate();
  }, [clearAlertsMutation]);

  // Test multiple toast notifications (admin feature)
  const testMultipleToasts = useCallback(() => {
    const testOpportunities = [
      { route: 'Binance → VALR', spread: 1000, spreadPercentage: 2.5 },
      { route: 'Kraken → LUNO', spread: 1500, spreadPercentage: 3.2 },
      { route: 'Bitfinex → AltcoinTrader', spread: 800, spreadPercentage: 1.8 }
    ];

    testOpportunities.forEach((opportunity, index) => {
      setTimeout(() => {
        toast({
          title: `🚨 Test Alert ${index + 1}`,
          description: `${opportunity.route}: ${opportunity.spreadPercentage}% spread (R${opportunity.spread.toLocaleString()})`,
          variant: "default",
          duration: 10000 // Keep longer for testing
        });
      }, index * 500); // Stagger the notifications
    });
  }, [toast]);

  // Test browser notification (admin feature)
  const testBrowserNotification = useCallback(async () => {
    try {
      // Check if browser supports notifications
      if (!("Notification" in window)) {
        throw new Error('Browser notifications are not supported in this browser');
      }

      // Request permission if needed
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'denied') {
        throw new Error('Browser notifications are blocked. Please enable them in your browser settings.');
      }

      if (permission === 'granted') {
        // Create test notification
        const notification = new Notification('Test Alert - Zarbitrage', {
          body: 'Sample arbitrage opportunity: Binance → VALR: 3.45% spread detected',
          icon: '/favicon.ico',
          requireInteraction: false
        });

        notification.onerror = () => {
          console.error('Test browser notification failed to display');
        };

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return { success: true, message: 'Test notification sent successfully!' };
      }
    } catch (error) {
      console.error('Test browser notification failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send test notification'
      };
    }
  }, []);

  // Combined loading state
  const isLoading = alertHistoryQuery.isLoading || 
                    addAlertMutation.isPending || 
                    clearAlertsMutation.isPending;

  return {
    alertHistory: cachedAlerts,
    isLoading,
    error: alertHistoryQuery.error,
    options,
    triggerAlert,
    toggleSoundAlerts,
    toggleBrowserNotifications,
    clearAlerts,
    testBrowserNotification,
    testMultipleToasts
  };
}
