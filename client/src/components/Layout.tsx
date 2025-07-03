import { ReactNode } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { APP_VERSION } from '@/lib/version';

interface LayoutProps {
  children: ReactNode;
  headerOptions?: {
    refreshRate: number;
    setRefreshRate: (rate: number) => void;
    refreshData: () => void;
    isLoading: boolean;
  };
}

export default function Layout({ children, headerOptions }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  
  // Default values for header if not provided
  const defaultHeaderOptions = {
    refreshRate: 30,
    setRefreshRate: () => {},
    refreshData: () => {},
    isLoading: false
  };
  
  const headerProps = headerOptions || defaultHeaderOptions;
  
  return (
    <div className="bg-gray-100 font-sans min-h-screen flex flex-col">
      <Header 
        refreshRate={headerProps.refreshRate}
        setRefreshRate={headerProps.setRefreshRate}
        refreshData={headerProps.refreshData}
        isLoading={headerProps.isLoading}
      />
      
      <main className="flex-grow py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-3 md:py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-gray-500">
          <div className="mb-1 md:mb-0 flex flex-col md:flex-row md:items-center md:space-x-4">
            <span>© {new Date().getFullYear()} ZArbitrage</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md mt-1 md:mt-0">
              v{APP_VERSION}
            </span>
          </div>
          <div>
            <span>Sources: Bitstamp, Bitfinex, Binance, Kraken, KuCoin, LUNO, VALR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}