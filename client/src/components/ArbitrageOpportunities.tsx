import { useState, useEffect, useRef } from 'react';
import { Skeleton, useTheme } from '@/components/dark-ui';
import { ArbitrageOpportunity } from '@/lib/types';
import ArbitrageOpportunityCard from '@/components/ArbitrageOpportunityCard';

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
  const { theme } = useTheme();
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
      }, 1000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [opportunities, loading, prevOpportunities]);


  // Card-based mobile view for smaller screens
  const renderMobileOpportunityCards = () => {
    if (loading) {
      return Array(4).fill(0).map((_, index) => (
        <div key={`mobile-opp-loading-${index}`} className="mb-4">
          <Skeleton height="5rem" width="100%" variant="rounded" />
        </div>
      ));
    }

    if (!opportunities || opportunities.length === 0) {
      return (
        <div 
          className="p-4 text-center text-sm"
          style={{ color: theme.colors.text.secondary }}
        >
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
        <div key={`mobile-opp-${index}`} className="mb-4">
          <ArbitrageOpportunityCard
            opportunity={opportunity}
            isAboveThreshold={isAboveThreshold}
            isUpdated={isUpdated}
            changeDirection={direction}
          />
        </div>
      );
    });
  };

  return (
    <div className="mb-6" data-testid="arbitrage-opportunities">
      {/* Desktop view - Card grid */}
      <div className="hidden md:block space-y-4">
        {renderMobileOpportunityCards()}
      </div>

      {/* Mobile view - Card list */}
      <div className="md:hidden space-y-4">
        {renderMobileOpportunityCards()}
      </div>
    </div>
  );
}
