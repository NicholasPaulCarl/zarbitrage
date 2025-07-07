import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/dark-ui';
import { Trash2, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatZAR, formatDateTime } from '@/lib/formatters';
import { AlertHistoryItem } from '@/lib/types';
import { useTheme } from '@/components/dark-ui';

interface AlertHistoryProps {
  alerts: AlertHistoryItem[];
  clearAlerts: () => void;
  isLoading?: boolean;
}

export default function AlertHistory({ alerts, clearAlerts, isLoading = false }: AlertHistoryProps) {
  const { theme } = useTheme();
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sort alerts by timestamp (newest first)
  const sortedAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    
    // Create a copy to avoid mutation and sort by timestamp (newest first)
    return [...alerts].sort((a, b) => {
      // Convert timestamps to numbers for comparison
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;  // Descending order (newest first)
    });
  }, [alerts]);
  
  // Calculate total pages based on sorted alerts
  const totalPages = Math.ceil((sortedAlerts?.length || 0) / ITEMS_PER_PAGE);
  
  // Get current page items from sorted alerts
  const getCurrentPageItems = () => {
    if (!sortedAlerts || sortedAlerts.length === 0) return [];
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedAlerts.slice(startIndex, endIndex);
  };
  
  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Reset page when alert count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [alerts.length]);

  // Render alert content
  const renderAlerts = () => {
    // Show loading spinner
    if (isLoading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <Loader className="h-6 w-6 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        </div>
      );
    }
    
    // Show empty state
    if (!alerts || alerts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] p-6">
          <div className="bg-muted/50 p-3 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </div>
          <h3 className="text-sm font-medium mb-1">No alerts yet</h3>
          <p className="text-center text-sm text-muted-foreground max-w-[240px]">
            Alerts will appear here when arbitrage opportunities exceed your threshold.
          </p>
        </div>
      );
    }

    // Show current page alerts
    return getCurrentPageItems().map((alert) => (
      <div 
        key={alert.id} 
        className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0"
        style={{ backgroundColor: theme.colors.background.primary }} 
        data-alert-id={alert.id}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.colors.primary.main }}
            ></div>
            <div className="text-sm font-medium flex items-center flex-wrap gap-1">
              <span 
                className="truncate max-w-[150px] sm:max-w-none"
                style={{ color: theme.colors.text.primary }}
              >
                {alert.route}
              </span>
            </div>
          </div>
          <div className="ml-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
            <div className="flex items-center">
              <span className="text-xs mr-1.5" style={{ color: theme.colors.text.secondary }}>Spread:</span>
              <span className="text-xs font-medium" style={{ color: theme.colors.status.success }}>{alert.spreadPercentage.toFixed(2)}%</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs mr-1.5" style={{ color: theme.colors.text.secondary }}>Value:</span>
              <span className="text-xs font-medium" style={{ color: theme.colors.text.primary }}>{formatZAR(alert.spread)}</span>
            </div>
            <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
              {formatDateTime(alert.timestamp)}
            </div>
          </div>
        </div>
        <div className="ml-4 sm:ml-0">
          <div 
            className="px-2.5 py-1 text-xs rounded-full font-medium"
            style={{
              backgroundColor: `${theme.colors.status.success}15`,
              border: `1px solid ${theme.colors.status.success}30`,
              color: theme.colors.status.success
            }}
          >
            Profitable
          </div>
        </div>
      </div>
    ));
  };

  // No longer needed as pagination is integrated into the main return

  return (
    <div className="rounded-lg">
      {/* Header with clear button */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
          Showing {Math.min(sortedAlerts.length, ITEMS_PER_PAGE)} of {alerts.length} alerts
        </p>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <Loader className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <Button 
            variant="danger" 
            size="sm"
            onClick={clearAlerts}
            disabled={isLoading || !alerts || alerts.length === 0}
            className="h-8 text-xs" 
            id="clear-alerts"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear History
          </Button>
        </div>
      </div>
      
      {/* Alerts list */}
      <div 
        className="border rounded-lg overflow-hidden"
        style={{ borderColor: theme.colors.border.primary }}
      >
        <div 
          className="divide-y min-h-[300px]"
          style={{ 
            borderColor: theme.colors.border.primary
          }}
        >
          {renderAlerts()}
        </div>
        
        {/* Pagination */}
        {alerts.length > 0 && !isLoading && (
          <div 
            className="p-2 flex justify-between items-center border-t"
            style={{ 
              borderColor: theme.colors.border.primary
            }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={currentPage === 1 || isLoading}
              className="text-muted-foreground h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
              Previous
            </Button>
            
            <span className="text-xs text-muted-foreground font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages || isLoading}
              className="text-muted-foreground h-8 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
