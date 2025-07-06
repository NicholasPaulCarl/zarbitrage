import React, { useMemo } from 'react';
import { ArbitrageOpportunity } from '@shared/schema';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useTheme } from './dark-ui';
import { useIsMobile } from '../hooks/use-mobile';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip
} from 'recharts';

interface SpreadTreeMapProps {
  opportunities: ArbitrageOpportunity[];
  loading: boolean;
}

// Custom tooltip component for displaying arbitrage opportunity details
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length || !payload[0].payload) return null;
  
  const data = payload[0].payload;
  
  // Handle the special "No valid opportunities" placeholder
  if (data.name === "No valid opportunities") {
    return (
      <Card className="bg-white shadow-lg border p-0 max-w-xs">
        <CardContent className="p-3">
          <h3 className="font-bold text-base">No Opportunities</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There are currently no positive spread opportunities available. 
            Check back after prices update.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Regular arbitrage opportunity tooltip
  return (
    <Card className="bg-white shadow-lg border p-0 max-w-xs">
      <CardContent className="p-3">
        {/* Large spread percentage display at the top */}
        <div className="bg-primary/10 rounded-md p-2 mb-3 text-center">
          <div className="text-primary text-3xl font-extrabold">
            {typeof data.value === 'number' ? `${data.value.toFixed(2)}%` : 'N/A'}
          </div>
          <div className="text-xs font-bold">Potential Spread</div>
        </div>
        
        <h3 className="font-extrabold text-lg border-b pb-1 mb-2">{data.name}</h3>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-base">
          {/* Buy exchange information */}
          <div className="font-bold">Buy:</div>
          <div className="font-bold">{data.buyExchange || 'N/A'}</div>
          
          <div className="font-bold">Buy Price:</div>
          <div className="font-bold">
            {data.buyPrice ? 
              new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD'
              }).format(data.buyPrice)
              : 'N/A'
            }
          </div>
          
          {/* Sell exchange information */}
          <div className="font-bold">Sell:</div>
          <div className="font-bold">{data.sellExchange || 'N/A'}</div>
          
          <div className="font-bold">Sell Price:</div>
          <div className="font-bold">
            {data.sellPrice ? 
              new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'ZAR'
              }).format(data.sellPrice)
              : 'N/A'
            }
          </div>
          
          {/* Profit details */}
          <div className="font-bold">Profit:</div>
          <div className="font-bold">
            {data.spread ? 
              new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'ZAR'
              }).format(data.spread)
              : 'N/A'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SpreadTreeMap({ opportunities, loading }: SpreadTreeMapProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  
  // Process data for treemap visualization
  const treeMapData = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];
    
    // Filter for positive spreads, sort by percentage (highest first), and take only top 5
    const filteredOpportunities = [...opportunities]
      .filter(opp => opp && typeof opp.spreadPercentage === 'number' && opp.spreadPercentage > 0)
      .sort((a, b) => b.spreadPercentage - a.spreadPercentage)
      .slice(0, 5); // Only show top 5 opportunities
    
    // If no valid opportunities, return a placeholder
    if (filteredOpportunities.length === 0) {
      return [{
        name: "No valid opportunities",
        value: 1,
        fill: theme.colors.background.tertiary
      }];
    }
    
    // Transform data for TreeMap component
    return filteredOpportunities.map((opportunity, index) => {
      // Use the primary color (#6D00D1) with varying opacity based on spread percentage
      const opacity = 0.6 + Math.min(0.4, opportunity.spreadPercentage * 0.04);
      
      // Color variants using the primary purple color (#6D00D1) with different saturations
      const colors = [
        `rgba(109, 0, 209, ${opacity})`,        // Primary purple
        `rgba(95, 0, 183, ${opacity})`,         // Slightly darker purple
        `rgba(81, 0, 157, ${opacity})`,         // Even darker purple
        `rgba(123, 20, 225, ${opacity})`,       // Deep purple variant
        `rgba(139, 51, 255, ${opacity * 0.95})` // Lighter purple
      ];
      
      // Cycle through colors based on index
      const colorIndex = index % colors.length;
      
      // Include the percentage in the display name
      return {
        name: `${opportunity.route}\n${opportunity.spreadPercentage.toFixed(2)}%`,
        value: opportunity.spreadPercentage,
        spread: opportunity.spread,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
        fill: colors[colorIndex]
      };
    });
  }, [opportunities]);
  
  // Show loading skeleton
  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-[500px] w-full rounded-md" />
      </div>
    );
  }
  
  // Handle empty state
  if (treeMapData.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No positive spread opportunities found at the moment. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Render the TreeMap visualization
  return (
    <div className="w-full h-[600px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treeMapData}
          dataKey="value"
          nameKey="name"
          aspectRatio={isMobile ? 1 : 4 / 3}
          stroke={theme.colors.background.primary}
          isAnimationActive
          animationDuration={800}
          // Add custom styles for the treemap labels
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            fill: theme.colors.primary.contrast,
            textShadow: '0 1px 3px rgba(0,0,0,0.7)'
          }}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}