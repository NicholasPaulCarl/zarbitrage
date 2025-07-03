import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Exchange } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPercentage } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketSentimentProps {
  internationalExchanges: Exchange[];
  localExchanges: Exchange[];
  loading: boolean;
}

type SentimentTrend = 'bullish' | 'bearish' | 'neutral' | 'mixed';
type MarketSpeed = 'fast' | 'medium' | 'slow';

interface MarketStatus {
  trend: SentimentTrend;
  strength: number; // 0-100
  volatility: number; // 0-100
  speed: MarketSpeed;
  indicator?: string;
}

export default function MarketSentiment({ 
  internationalExchanges, 
  localExchanges, 
  loading 
}: MarketSentimentProps) {
  const [internationalMarket, setInternationalMarket] = useState<MarketStatus>({
    trend: 'neutral',
    strength: 0,
    volatility: 0,
    speed: 'slow'
  });
  
  const [localMarket, setLocalMarket] = useState<MarketStatus>({
    trend: 'neutral',
    strength: 0,
    volatility: 0,
    speed: 'slow'
  });
  
  const [spreadTrend, setSpreadTrend] = useState<MarketStatus>({
    trend: 'neutral',
    strength: 0,
    volatility: 0,
    speed: 'slow'
  });

  // Keep previous data for comparisons
  const [previousData, setPreviousData] = useState<{
    international: Exchange[];
    local: Exchange[];
    timestamp: number;
  }>({
    international: [],
    local: [],
    timestamp: Date.now()
  });

  useEffect(() => {
    if (loading || !internationalExchanges.length || !localExchanges.length) {
      return;
    }
    
    // Calculate time since last update to determine market speed
    const currentTime = Date.now();
    const timeDiff = currentTime - previousData.timestamp;
    const marketSpeed: MarketSpeed = timeDiff < 10000 ? 'fast' : timeDiff < 30000 ? 'medium' : 'slow';
    
    // Calculate international market sentiment
    const internationalSentiment = calculateMarketSentiment(
      internationalExchanges, 
      previousData.international,
      marketSpeed
    );
    setInternationalMarket(internationalSentiment);
    
    // Calculate local market sentiment
    const localSentiment = calculateMarketSentiment(
      localExchanges, 
      previousData.local,
      marketSpeed
    );
    setLocalMarket(localSentiment);
    
    // Calculate spread trend
    const spreadSentiment = calculateSpreadSentiment(
      internationalSentiment,
      localSentiment
    );
    setSpreadTrend(spreadSentiment);
    
    // Update previous data for next comparison
    setPreviousData({
      international: [...internationalExchanges],
      local: [...localExchanges],
      timestamp: currentTime
    });
  }, [internationalExchanges, localExchanges, loading]);

  const calculateMarketSentiment = (
    currentExchanges: Exchange[], 
    previousExchanges: Exchange[],
    speed: MarketSpeed
  ): MarketStatus => {
    if (!previousExchanges.length) {
      return {
        trend: 'neutral',
        strength: 50,
        volatility: 0,
        speed
      };
    }
    
    // Calculate price changes for each exchange
    const priceChanges = currentExchanges.map(current => {
      const previous = previousExchanges.find(prev => prev.name === current.name);
      if (!previous) return 0;
      
      return ((current.price - previous.price) / previous.price) * 100;
    }).filter(change => !isNaN(change));
    
    // Skip if no valid price changes
    if (priceChanges.length === 0) {
      return {
        trend: 'neutral',
        strength: 50,
        volatility: 0,
        speed
      };
    }
    
    // Calculate average price change
    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    
    // Calculate volatility (standard deviation of price changes)
    const squaredDiffs = priceChanges.map(change => Math.pow(change - avgChange, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
    const volatility = Math.min(100, Math.sqrt(avgSquaredDiff) * 10); // Scale to 0-100
    
    // Determine trend based on average change
    let trend: SentimentTrend;
    if (avgChange > 0.2) {
      trend = 'bullish';
    } else if (avgChange < -0.2) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }
    
    // Check if prices are mixed (some up, some down)
    const positiveChanges = priceChanges.filter(change => change > 0).length;
    const negativeChanges = priceChanges.filter(change => change < 0).length;
    
    if (positiveChanges > 0 && negativeChanges > 0 && 
        positiveChanges >= priceChanges.length * 0.3 && 
        negativeChanges >= priceChanges.length * 0.3) {
      trend = 'mixed';
    }
    
    // Calculate strength (0-100) based on magnitude of change
    // Higher absolute change = higher strength
    const strength = Math.min(100, 50 + Math.abs(avgChange) * 25);
    
    return {
      trend,
      strength,
      volatility,
      speed,
      indicator: avgChange !== 0 ? formatPercentage(avgChange) : undefined
    };
  };
  
  const calculateSpreadSentiment = (
    international: MarketStatus,
    local: MarketStatus
  ): MarketStatus => {
    // Spread increases when:
    // - International is bullish and local is bearish or neutral
    // - International is neutral and local is bearish
    // - Local is bullish and international is bearish or neutral
    // - International is bearish and local is bearish but at different rates
    
    let trend: SentimentTrend = 'neutral';
    let strength = 50;
    
    if (international.trend === 'bullish' && (local.trend === 'bearish' || local.trend === 'neutral')) {
      trend = 'bullish'; // Spread is likely increasing
      strength = 70 + (international.strength - local.strength) / 10;
    } else if (international.trend === 'neutral' && local.trend === 'bearish') {
      trend = 'bullish'; // Spread is moderately increasing
      strength = 60 + local.strength / 10;
    } else if (local.trend === 'bullish' && (international.trend === 'bearish' || international.trend === 'neutral')) {
      trend = 'bullish'; // Spread is likely increasing
      strength = 70 + (local.strength - international.strength) / 10;
    } else if (international.trend === 'bearish' && local.trend === 'bearish') {
      // Both markets falling, but check which is falling faster
      const spreadDiff = international.strength - local.strength;
      if (Math.abs(spreadDiff) > 10) {
        trend = spreadDiff > 0 ? 'bearish' : 'bullish';
        strength = 50 + Math.abs(spreadDiff) / 2;
      } else {
        trend = 'neutral';
        strength = 50;
      }
    } else if (international.trend === 'bullish' && local.trend === 'bullish') {
      // Both markets rising, but check which is rising faster
      const spreadDiff = international.strength - local.strength;
      if (Math.abs(spreadDiff) > 10) {
        trend = spreadDiff > 0 ? 'bullish' : 'bearish';
        strength = 50 + Math.abs(spreadDiff) / 2;
      } else {
        trend = 'neutral';
        strength = 50;
      }
    } else if (international.trend === 'mixed' || local.trend === 'mixed') {
      trend = 'mixed';
      strength = 60;
    }
    
    // Limit strength to 0-100 range
    strength = Math.max(0, Math.min(100, strength));
    
    // Volatility is average of both markets plus a bonus if both are volatile
    const volatility = (international.volatility + local.volatility) / 2 + 
                      (international.volatility > 30 && local.volatility > 30 ? 20 : 0);
    
    // Speed is the faster of the two
    const speed: MarketSpeed = international.speed === 'fast' || local.speed === 'fast' 
      ? 'fast' 
      : international.speed === 'medium' || local.speed === 'medium' 
        ? 'medium' 
        : 'slow';
    
    return {
      trend,
      strength,
      volatility: Math.min(100, volatility),
      speed
    };
  };
  
  // Render sentiment indicator
  const renderSentimentIndicator = (sentiment: MarketStatus) => {
    let color = '';
    let bgColor = '';
    let icon = null;
    let label = '';
    let borderColor = '';
    
    // Calculate intensity level (0-5)
    const intensity = Math.floor(sentiment.strength / 20);
    
    switch (sentiment.trend) {
      case 'bullish':
        color = 'text-green-600';
        icon = <TrendingUp className="h-4 w-4 mr-1.5" />;
        label = 'Bullish';
        
        // Set background color based on intensity
        switch(intensity) {
          case 0:
            bgColor = 'bg-green-50';
            borderColor = 'border-green-100';
            break;
          case 1:
            bgColor = 'bg-green-100';
            borderColor = 'border-green-200';
            break;
          case 2:
            bgColor = 'bg-green-100';
            borderColor = 'border-green-200';
            break;
          case 3:
            bgColor = 'bg-green-200';
            borderColor = 'border-green-300';
            break;
          case 4:
            bgColor = 'bg-green-200';
            borderColor = 'border-green-300';
            break;
          case 5:
            bgColor = 'bg-green-300';
            borderColor = 'border-green-400';
            break;
          default:
            bgColor = 'bg-green-100';
            borderColor = 'border-green-200';
        }
        break;
        
      case 'bearish':
        color = 'text-red-600';
        icon = <TrendingDown className="h-4 w-4 mr-1.5" />;
        label = 'Bearish';
        
        // Set background color based on intensity
        switch(intensity) {
          case 0:
            bgColor = 'bg-red-50';
            borderColor = 'border-red-100';
            break;
          case 1:
            bgColor = 'bg-red-100';
            borderColor = 'border-red-200';
            break;
          case 2:
            bgColor = 'bg-red-100';
            borderColor = 'border-red-200';
            break;
          case 3:
            bgColor = 'bg-red-200';
            borderColor = 'border-red-300';
            break;
          case 4:
            bgColor = 'bg-red-200';
            borderColor = 'border-red-300';
            break;
          case 5:
            bgColor = 'bg-red-300';
            borderColor = 'border-red-400';
            break;
          default:
            bgColor = 'bg-red-100';
            borderColor = 'border-red-200';
        }
        break;
        
      case 'mixed':
        color = 'text-yellow-600';
        bgColor = 'bg-yellow-100';
        borderColor = 'border-yellow-200';
        icon = <AlertTriangle className="h-4 w-4 mr-1.5" />;
        label = 'Mixed';
        break;
        
      default:
        color = 'text-gray-600';
        bgColor = 'bg-gray-100';
        borderColor = 'border-gray-200';
        icon = <Minus className="h-4 w-4 mr-1.5" />;
        label = 'Neutral';
    }
    
    return (
      <div className={`rounded-md border ${borderColor} p-2 flex items-center`}>
        <div className={`rounded-full ${bgColor} p-1 mr-2 flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center">
            <span className={`font-medium ${color}`}>{label}</span>
            {sentiment.indicator && (
              <span className={`ml-1.5 text-xs ${color}`}>
                {sentiment.indicator}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
            <span className="mr-4">
              Strength: {Math.round(sentiment.strength)}%
            </span>
            {sentiment.volatility > 30 && (
              <span>Volatility: {Math.round(sentiment.volatility)}%</span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render each market speed indicator
  const renderSpeedIndicator = (speed: MarketSpeed) => {
    let dots = [];
    let color = '';
    let label = '';
    
    switch(speed) {
      case 'fast':
        dots = [1, 1, 1];
        color = 'bg-green-500';
        label = 'Fast';
        break;
      case 'medium':
        dots = [1, 1, 0];
        color = 'bg-yellow-500';
        label = 'Medium';
        break;
      default:
        dots = [1, 0, 0];
        color = 'bg-gray-400';
        label = 'Slow';
    }
    
    return (
      <div className="flex items-center">
        <div className="flex space-x-1 mr-1.5">
          {dots.map((active, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full ${active ? color : 'bg-gray-200'}`} 
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            {/* International Markets Skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-40" />
                <div className="flex space-x-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
              </div>
              <div className="rounded-md border border-gray-200 p-2">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-2" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Local Markets Skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28" />
                <div className="flex space-x-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
              </div>
              <div className="rounded-md border border-gray-200 p-2">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-2" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spread Trend Skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-36" />
                <div className="flex space-x-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
              </div>
              <div className="rounded-md border border-gray-200 p-2">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-2" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Market Sentiment</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground rounded-full p-1 hover:bg-muted">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Market sentiment indicators analyze price movements to detect market trends.
                  Bullish markets trend upward, bearish markets trend downward, and mixed
                  markets show conflicting signals.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Real-time trend analysis and arbitrage opportunity indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">International Markets</h3>
              {renderSpeedIndicator(internationalMarket.speed)}
            </div>
            {renderSentimentIndicator(internationalMarket)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Local Markets</h3>
              {renderSpeedIndicator(localMarket.speed)}
            </div>
            {renderSentimentIndicator(localMarket)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Arbitrage Spread Trend</h3>
              {renderSpeedIndicator(spreadTrend.speed)}
            </div>
            {renderSentimentIndicator(spreadTrend)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}