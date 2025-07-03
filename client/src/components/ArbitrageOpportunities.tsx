import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatZAR, formatPercentage } from '@/lib/formatters';
import { ArbitrageOpportunity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingUp, ArrowRightCircle, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArbitrageOpportunitiesProps {
  opportunities: ArbitrageOpportunity[];
  threshold: number;
  loading: boolean;
}

export default function ArbitrageOpportunities({
  opportunities,
  threshold,
  loading
}: ArbitrageOpportunitiesProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prevOpportunities, setPrevOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [updatedRows, setUpdatedRows] = useState<Record<string, boolean>>({});
  const [changeDirection, setChangeDirection] = useState<Record<string, {spread: number, percentage: number}>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track data changes for micro-interactions
  useEffect(() => {
    // Skip initial render
    if (prevOpportunities.length === 0 && opportunities.length > 0) {
      setPrevOpportunities([...opportunities]);
      return;
    }
    
    // Don't trigger animations while loading
    if (loading) return;
    
    if (opportunities.length > 0 && JSON.stringify(opportunities) !== JSON.stringify(prevOpportunities)) {
      // Data has changed, trigger refresh animation
      setIsRefreshing(true);
      
      // Identify which rows have changed values
      const rowUpdates: Record<string, boolean> = {};
      const directions: Record<string, {spread: number, percentage: number}> = {};
      
      opportunities.forEach(opportunity => {
        const key = `${opportunity.buyExchange}-${opportunity.sellExchange}`;
        
        // Find matching opportunity in previous data
        const prevOpp = prevOpportunities.find(p => 
          p.buyExchange === opportunity.buyExchange && 
          p.sellExchange === opportunity.sellExchange
        );
        
        if (prevOpp) {
          // Check if values have changed
          if (prevOpp.spread !== opportunity.spread || 
              prevOpp.spreadPercentage !== opportunity.spreadPercentage) {
            
            rowUpdates[key] = true;
            
            // Track value change directions
            directions[key] = {
              spread: opportunity.spread > prevOpp.spread ? 1 : 
                     opportunity.spread < prevOpp.spread ? -1 : 0,
              percentage: opportunity.spreadPercentage > prevOpp.spreadPercentage ? 1 : 
                         opportunity.spreadPercentage < prevOpp.spreadPercentage ? -1 : 0
            };
          }
        } else {
          // New opportunity
          rowUpdates[key] = true;
          directions[key] = { spread: 1, percentage: 1 }; // Assume new is positive
        }
      });
      
      setUpdatedRows(rowUpdates);
      setChangeDirection(directions);
      
      // Update previous opportunities for next comparison
      setPrevOpportunities([...opportunities]);
      
      // Reset animations after delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
        setUpdatedRows({});
      }, 2000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [opportunities, loading, prevOpportunities]);

  const renderOpportunities = () => {
    if (loading) {
      return Array(4).fill(0).map((_, index) => (
        <tr key={`opp-loading-${index}`} className="hover:bg-blue-50">
          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
            <Skeleton className="h-5 w-24 md:w-32" />
          </td>
          <td className="px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            <Skeleton className="h-5 w-16 md:w-24 ml-auto" />
          </td>
          <td className="px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            <Skeleton className="h-5 w-14 md:w-16 ml-auto" />
          </td>
          <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-sm text-right">
            <Skeleton className="h-5 w-24 md:w-28 ml-auto" />
          </td>
          <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-sm text-right">
            <Skeleton className="h-5 w-24 md:w-28 ml-auto" />
          </td>
        </tr>
      ));
    }

    if (!opportunities || opportunities.length === 0) {
      return (
        <tr>
          <td colSpan={isMobile ? 3 : 5} className="px-4 py-8 text-center text-sm text-gray-500">
            No arbitrage opportunities found
          </td>
        </tr>
      );
    }

    // Only show the top 5 arbitrage opportunities
    return opportunities.slice(0, 5).map((opportunity, index) => {
      const isAboveThreshold = opportunity.spreadPercentage >= threshold;
      const rowKey = `${opportunity.buyExchange}-${opportunity.sellExchange}`;
      const isUpdated = updatedRows[rowKey];
      const direction = changeDirection[rowKey];
      
      return (
        <tr 
          key={`opp-${index}`} 
          className={cn(
            "transition-colors duration-500 ease-in-out",
            "hover:bg-blue-50", 
            isAboveThreshold && "animate-pulse bg-red-50",
            isUpdated && "bg-blue-50"
          )} 
          data-opportunity-id={`${opportunity.buyExchange.toLowerCase()}-${opportunity.sellExchange.toLowerCase()}`}
        >
          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
            {opportunity.route}
          </td>
          <td className="px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            <span className={cn(
              "transition-colors duration-300",
              isUpdated && direction?.spread > 0 && "text-green-600",
              isUpdated && direction?.spread < 0 && "text-red-600",
              !isUpdated && "text-green-600"
            )}>
              {formatZAR(opportunity.spread)}
              {isUpdated && direction?.spread > 0 && (
                <ArrowUp className="inline-block ml-1 h-3 w-3 text-green-600" />
              )}
              {isUpdated && direction?.spread < 0 && (
                <ArrowDown className="inline-block ml-1 h-3 w-3 text-red-600" />
              )}
            </span>
          </td>
          <td className="px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            <Badge 
              variant="outline" 
              className={cn(
                "transition-colors duration-300",
                isAboveThreshold ? "bg-green-50 text-green-700 border-green-200" : "",
                isUpdated && direction?.percentage > 0 ? "bg-green-100 border-green-300 text-green-800" : "",
                isUpdated && direction?.percentage < 0 ? "bg-red-50 border-red-200 text-red-700" : ""
              )}
            >
              {formatPercentage(opportunity.spreadPercentage)}
              {isUpdated && direction?.percentage > 0 && (
                <ArrowUp className="inline-block ml-0.5 h-2.5 w-2.5" />
              )}
              {isUpdated && direction?.percentage < 0 && (
                <ArrowDown className="inline-block ml-0.5 h-2.5 w-2.5" />
              )}
            </Badge>
          </td>
          <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            {formatZAR(opportunity.buyPrice)}
          </td>
          <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-xs md:text-sm text-right">
            {formatZAR(opportunity.sellPrice)}
          </td>
        </tr>
      );
    });
  };

  // Card-based mobile view for smaller screens
  const renderMobileOpportunityCards = () => {
    if (loading) {
      return Array(4).fill(0).map((_, index) => (
        <div key={`mobile-opp-loading-${index}`} className="p-3 border-b border-gray-100">
          <Skeleton className="h-5 w-40 mb-2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ));
    }

    if (!opportunities || opportunities.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-gray-500">
          No arbitrage opportunities found
        </div>
      );
    }

    // Only show the top 5 arbitrage opportunities
    return opportunities.slice(0, 5).map((opportunity, index) => {
      const isAboveThreshold = opportunity.spreadPercentage >= threshold;
      const rowKey = `${opportunity.buyExchange}-${opportunity.sellExchange}`;
      const isUpdated = updatedRows[rowKey];
      const direction = changeDirection[rowKey];
      
      return (
        <div 
          key={`mobile-opp-${index}`} 
          className={cn(
            "p-3 border-b border-gray-100 transition-colors duration-500", 
            isAboveThreshold && "animate-pulse bg-red-50",
            isUpdated && "bg-blue-50"
          )}
          data-opportunity-id={`mobile-${opportunity.buyExchange.toLowerCase()}-${opportunity.sellExchange.toLowerCase()}`}
        >
          {/* Top row: Exchange names and percentage */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs text-gray-900 truncate">{opportunity.buyExchange}</span>
              <ArrowRightCircle className="h-3 w-3 text-gray-500" />
              <span className="font-medium text-xs text-gray-900 truncate">{opportunity.sellExchange}</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-semibold transition-colors duration-300", 
                isAboveThreshold ? "bg-green-50 text-green-700 border-green-200" : "",
                isUpdated && direction?.percentage > 0 ? "bg-green-100 border-green-300 text-green-800" : "",
                isUpdated && direction?.percentage < 0 ? "bg-red-50 border-red-200 text-red-700" : ""
              )}
            >
              {formatPercentage(opportunity.spreadPercentage)}
              {isUpdated && direction?.percentage > 0 && (
                <ArrowUp className="inline-block ml-0.5 h-2.5 w-2.5" />
              )}
              {isUpdated && direction?.percentage < 0 && (
                <ArrowDown className="inline-block ml-0.5 h-2.5 w-2.5" />
              )}
            </Badge>
          </div>
          
          {/* Middle row: Spread in ZAR */}
          <div className="flex flex-col justify-start mb-3">
            <div className="text-xs text-gray-500">Spread (ZAR):</div>
            <div className={cn(
              "text-xs font-medium transition-colors duration-300",
              isUpdated && direction?.spread > 0 && "text-green-600",
              isUpdated && direction?.spread < 0 && "text-red-600",
              !isUpdated && "text-green-600"
            )}>
              {formatZAR(opportunity.spread)}
              {isUpdated && direction?.spread > 0 && (
                <ArrowUp className="inline-block ml-0.5 h-2.5 w-2.5 text-green-600" />
              )}
              {isUpdated && direction?.spread < 0 && (
                <ArrowDown className="inline-block ml-0.5 h-2.5 w-2.5 text-red-600" />
              )}
            </div>
          </div>
          
          {/* Bottom row: Buy and Sell prices */}
          <div className="flex justify-between gap-2 text-xs">
            <div className="flex flex-col">
              <div className="text-gray-500">Buy Price:</div>
              <div className="font-medium">{formatZAR(opportunity.buyPrice)}</div>
            </div>
            <div className="flex flex-col">
              <div className="text-gray-500">Sell Price:</div> 
              <div className="font-medium">{formatZAR(opportunity.sellPrice)}</div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="relative overflow-hidden mb-6 bg-white rounded-lg p-4">
      {/* Refreshing indicator removed */}
      
      <div className="pb-3">
        <h3 className="text-base md:text-lg flex items-center font-medium">
          <div className="relative">
            <TrendingUp className={cn(
              "h-5 w-5 text-primary mr-2", 
              isRefreshing && "opacity-0 transition-opacity duration-300"
            )} />
            {isRefreshing && (
              <RefreshCw className="h-5 w-5 text-primary mr-2 absolute top-0 left-0 animate-spin" />
            )}
          </div>
          Top 5 Live Arbitrage Opportunities
          <span className="ml-2 text-xs text-gray-500 font-normal hidden sm:inline">
            Best price spreads between exchanges
          </span>
        </h3>
      </div>
      <div className="p-0">
        {/* Desktop view - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Spread (ZAR)</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Spread (%)</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderOpportunities()}
            </tbody>
          </table>
        </div>

        {/* Mobile view - Card list */}
        <div className="md:hidden">
          {renderMobileOpportunityCards()}
        </div>
      </div>
    </div>
  );
}
