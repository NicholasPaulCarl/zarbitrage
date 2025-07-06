import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useTheme
} from '@/components/dark-ui';
import { ChevronDown } from 'lucide-react';

interface AdminNavigationProps {
  activeTab?: string;
  children?: React.ReactNode;
}

export default function AdminNavigation({ activeTab, children }: AdminNavigationProps) {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState(activeTab || 'users');
  const { theme } = useTheme();
  
  // Navigation options for consistent use
  const navigationOptions = [
    { value: 'users', label: 'User Management' },
    { value: 'carousel', label: 'Carousel Management' },
    { value: 'payments', label: 'Payment Analytics' },
    { value: 'features', label: 'Feature Requests' },
    { value: 'subscription', label: 'Subscription Settings' },
    { value: 'debug', label: 'Authentication Debug' }
  ];
  
  // Detect the current page and update the tab accordingly
  useEffect(() => {
    if (location === '/admin') {
      setCurrentTab(activeTab || 'users');
    } else if (location === '/admin-debug') {
      setCurrentTab('debug');
    } else if (location === '/admin-payment-analytics') {
      setCurrentTab('payments');
    } else if (location === '/admin-carousel') {
      setCurrentTab('carousel');
    }
  }, [location, activeTab]);
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    if (value === 'debug') {
      setLocation('/admin-debug');
    } else if (value === 'carousel') {
      setLocation('/admin-carousel');
    } else if (value === 'payments') {
      setLocation('/admin-payment-analytics');
    } else if (value !== currentTab) {
      setLocation('/admin');
      setCurrentTab(value);
    }
  };
  
  // Get current tab label for dropdown display
  const getCurrentTabLabel = () => {
    const current = navigationOptions.find(option => option.value === currentTab);
    return current?.label || 'User Management';
  };
  
  return (
    <div className="w-full">
      {/* Mobile and Small Desktop Dropdown Navigation */}
      <div className="lg:hidden mb-6">
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={getCurrentTabLabel()}>
              {getCurrentTabLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {navigationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Large Desktop Tabs Navigation */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="hidden lg:grid w-full grid-cols-5 mb-6">
          {navigationOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {children}
      </Tabs>
    </div>
  );
}