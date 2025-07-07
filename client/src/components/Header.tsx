import { useState, useEffect } from 'react';
import { Button, Sheet, SheetContent, SheetTrigger, ThemeToggle } from '@/components/dark-ui';
import { 
  TrendingUp,
  AlertCircle,
  Calculator,
  Menu,
  PieChart,
  Settings,
  FileText,
  ClipboardList,
  CreditCard,
  BookOpen,
  LogIn,
  LogOut,
  Webhook,
  UserPlus,
  Palette
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import UserMenu from './UserMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/dark-ui';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

interface HeaderProps {
  refreshRate: number;
  setRefreshRate: (rate: number) => void;
  refreshData: () => void;
  isLoading: boolean;
}

export default function Header({ refreshRate, setRefreshRate, refreshData, isLoading }: HeaderProps) {
  const [status, setStatus] = useState<'live' | 'updating'>('live');
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme } = useTheme();

  // Update status when data is being refreshed
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      setStatus('updating');
    } else {
      // Add a small delay to make the status change visible
      timeoutId = setTimeout(() => {
        setStatus('live');
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  // Handle logout functionality
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: <TrendingUp className="h-4 w-4 mr-2" /> 
    },
    { 
      path: '/alerts', 
      label: 'Alerts', 
      icon: <AlertCircle className="h-4 w-4 mr-2" />,
      premiumFeature: true
    },
    { 
      path: '/calculator', 
      label: 'Calculator', 
      icon: <Calculator className="h-4 w-4 mr-2" />,
      premiumFeature: true
    },
    { 
      path: '/feature-requests', 
      label: 'Feature Requests', 
      icon: <ClipboardList className="h-4 w-4 mr-2" />,
      premiumFeature: true
    },
    // Premium features - always visible but require login
    {
      path: '/premium', 
      label: 'Premium', 
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      premiumFeature: true,
      requiresAuth: !user
    },
    {
      path: '/trade-journal', 
      label: 'Trade Journal', 
      icon: <BookOpen className="h-4 w-4 mr-2" />,
      premiumFeature: true,
      requiresAuth: !user
    },
    // Subscription activation link - only visible to authenticated users with inactive subscription
    ...(user && !user.subscriptionActive ? [{
      path: '/profile',
      label: 'Activate Subscription',
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      highlight: true
    }] : []),
    // Admin-only links - only visible to admin users
    ...(isAdmin ? [{
      path: '/admin',
      label: 'Admin Dashboard',
      icon: <Settings className="h-4 w-4 mr-2" />,
      adminFeature: true
    }, {
      path: '/ui-library',
      label: 'UI Library',
      icon: <Palette className="h-4 w-4 mr-2" />,
      adminFeature: true
    }] : [])
  ];

  return (
    <header 
      className="border-b sticky top-0 z-50"
      style={{ 
        backgroundColor: theme.colors.background.primary, 
        borderColor: theme.colors.border.primary 
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and App Name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div 
                className="p-1.5 rounded-md mr-2"
                style={{ backgroundColor: theme.colors.primary.main, color: '#FFFFFF' }}
              >
                <TrendingUp className="h-5 w-5" />
              </div>
              <h1 
                className="text-lg sm:text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                ZARbitrage
              </h1>
              <span 
                className="ml-2 md:ml-3 px-2 py-0.5 text-xs font-medium rounded-full flex items-center"
                style={{
                  backgroundColor: status === 'live' ? '#DEF7EC' : '#FEF3C7',
                  color: status === 'live' ? '#03543F' : '#92400E'
                }}
              >
                <span 
                  className={`h-1.5 w-1.5 rounded-full mr-1 ${status === 'live' ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: status === 'live' ? theme.colors.status.success : theme.colors.status.warning
                  }}
                />
                {status === 'live' ? 'Live' : 'Updating'}
              </span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle - always visible */}
            <ThemeToggle />
            
            {/* Login/Register buttons or User menu for desktop view - hidden on mobile */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Hamburger Menu Button - always visible for all device sizes */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="pt-5">
                {/* Logo in menu */}
                <div className="flex flex-col mb-6">
                  <div className="flex items-center pb-3">
                    <div 
                      className="p-1.5 rounded-md mr-2"
                      style={{ backgroundColor: theme.colors.primary.main, color: '#FFFFFF' }}
                    >
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h1 
                      className="text-xl font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      ZARbitrage
                    </h1>
                  </div>

                  {/* User Profile Section - Below logo - Always shown when authenticated */}
                  {user && (
                    <div 
                      className="flex items-center space-x-3 py-3 mb-2 border-b w-full"
                      style={{ borderColor: theme.colors.border.primary }}
                    >
                      <div className="flex items-center space-x-3">
                        <UserMenu showDropdown={false} />
                        <div className="flex flex-col">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {user?.username}
                          </span>
                          <span 
                            className="text-xs"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            {isAdmin ? 'Admin' : 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    item.requiresAuth ? (
                      <button
                        key={item.path}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          // Redirect to login page for non-authenticated users
                          window.location.href = '/login';
                        }}
                        className="px-3 py-3 text-sm font-medium rounded-md flex items-center text-left w-full"
                        style={{
                          color: theme.colors.text.secondary,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = theme.colors.primary.main;
                          (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.background.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = theme.colors.text.secondary;
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {item.premiumFeature && (
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded-md ml-2"
                            style={{
                              backgroundColor: theme.colors.status.warning + '20',
                              color: theme.colors.status.warning
                            }}
                          >
                            Premium
                          </span>
                        )}
                      </button>
                    ) : (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-3 text-sm font-medium rounded-md flex items-center"
                        style={{
                          color: location === item.path ? theme.colors.primary.main :
                                 item.highlight ? theme.colors.primary.main :
                                 theme.colors.text.secondary,
                          backgroundColor: location === item.path ? `${theme.colors.primary.main}20` :
                                          item.highlight ? `${theme.colors.primary.main}10` :
                                          'transparent',
                          borderWidth: item.highlight ? '1px' : '0',
                          borderStyle: 'solid',
                          borderColor: item.highlight ? `${theme.colors.primary.main}40` : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (location !== item.path) {
                            (e.currentTarget as HTMLElement).style.color = theme.colors.primary.main;
                            (e.currentTarget as HTMLElement).style.backgroundColor = item.highlight ? 
                              `${theme.colors.primary.main}20` : theme.colors.background.tertiary;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (location !== item.path) {
                            (e.currentTarget as HTMLElement).style.color = item.highlight ? 
                              theme.colors.primary.main : theme.colors.text.secondary;
                            (e.currentTarget as HTMLElement).style.backgroundColor = item.highlight ? 
                              `${theme.colors.primary.main}10` : 'transparent';
                          }
                        }}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {item.premiumFeature && (
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded-md ml-2"
                            style={{
                              backgroundColor: theme.colors.status.warning + '20',
                              color: theme.colors.status.warning
                            }}
                          >
                            Premium
                          </span>
                        )}
                        {item.adminFeature && (
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded-md ml-2"
                            style={{
                              backgroundColor: theme.colors.primary.main + '20',
                              color: theme.colors.primary.main
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </Link>
                    )
                  ))}
                </nav>

                {/* Authentication buttons - always visible */}
                <div className="mt-auto pt-6">
                  <div className="flex flex-col gap-2 p-2">
                    {user ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleLogout}
                        style={{
                          color: theme.colors.status.error,
                          borderColor: theme.colors.status.error + '50'
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            variant="outline" 
                            className="w-full"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Log in
                          </Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button 
                            className="w-full"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Sign up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Version Display - Fixed to bottom */}
                  <div 
                    className="border-t pt-3 mt-3"
                    style={{ borderColor: theme.colors.border.primary }}
                  >
                    <div className="text-center">
                      <p 
                        className="text-xs"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        ZArbitrage v{APP_VERSION}
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}