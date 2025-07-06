import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useAlerts from '@/hooks/useAlerts';
import AlertSettings from '@/components/AlertSettings';
import AlertHistory from '@/components/AlertHistory';
import Layout from '@/components/Layout';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { Separator, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Spinner, useTheme } from '@/components/dark-ui';
import { useLocation } from 'wouter';
import { Bell, InfoIcon, Lock } from 'lucide-react';

export default function AlertsPage() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const {
    alertHistory,
    isLoading: alertsLoading,
    options,
    toggleSoundAlerts,
    toggleBrowserNotifications,
    clearAlerts
  } = useAlerts();
  
  const [threshold, setThreshold] = useState(3.0);
  
  // Load threshold from localStorage on component mount
  useEffect(() => {
    const savedThreshold = localStorage.getItem('alertThreshold');
    if (savedThreshold) {
      setThreshold(parseFloat(savedThreshold));
    }
  }, []);
  
  // Save threshold to localStorage when it changes
  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    localStorage.setItem('alertThreshold', newThreshold.toString());
    console.log(`Alert threshold saved from alerts page: ${newThreshold}%`);
  };
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      // Using setLocation for instant navigation
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);
  
  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  // Return null to prevent content flash before redirect happens
  if (!isAuthenticated) {
    return null;
  }
  
  const content = (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 
            className="text-2xl font-bold tracking-tight"
            style={{ color: theme.colors.text.primary }}
          >
            Alerts
          </h1>
          <p style={{ color: theme.colors.text.secondary }}>
            Manage your arbitrage opportunity notifications
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <InfoIcon 
            className="h-4 w-4 mr-2" 
            style={{ color: theme.colors.text.secondary }}
          />
          <span 
            className="text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            Get notified when arbitrage opportunities exceed your threshold
          </span>
        </div>
      </div>
      
      <Tabs defaultValue="history" className="w-full">
        <TabsList 
          className="mb-6 grid grid-cols-2 w-full" 
          style={{ maxWidth: '400px' }}
        >
          <TabsTrigger value="history" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <InfoIcon className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" style={{ marginTop: 0 }}>
          <Card>
            <CardHeader style={{ paddingBottom: '0.75rem' }}>
              <div className="flex items-center space-x-2">
                <Bell 
                  className="h-5 w-5" 
                  style={{ color: theme.colors.primary.main }}
                />
                <CardTitle>Alert History</CardTitle>
              </div>
              <CardDescription>
                Recent arbitrage opportunities that exceeded your threshold of {threshold}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertHistory 
                alerts={alertHistory}
                clearAlerts={clearAlerts}
                isLoading={alertsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" style={{ marginTop: 0 }}>
          <Card>
            <CardHeader style={{ paddingBottom: '0.75rem' }}>
              <div className="flex items-center space-x-2">
                <InfoIcon 
                  className="h-5 w-5" 
                  style={{ color: theme.colors.primary.main }}
                />
                <CardTitle>Alert Settings</CardTitle>
              </div>
              <CardDescription>
                Configure when and how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertSettings 
                threshold={threshold}
                setThreshold={handleThresholdChange}
                soundEnabled={options.soundEnabled}
                browserNotificationEnabled={options.browserNotificationEnabled}
                toggleSoundAlerts={toggleSoundAlerts}
                toggleBrowserNotifications={toggleBrowserNotifications}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <Layout headerOptions={{
      refreshRate: 30,
      setRefreshRate: () => {},
      refreshData: () => {},
      isLoading: false
    }}>
      <SubscriptionGuard featureName="Arbitrage Alerts">
        {content}
      </SubscriptionGuard>
    </Layout>
  );
}