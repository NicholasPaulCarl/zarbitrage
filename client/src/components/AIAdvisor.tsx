import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dark-ui';
import { useTheme } from '@/components/dark-ui';
import { ArbitrageOpportunity } from '@/lib/types';
import { formatZAR, formatPercentage } from '@/lib/formatters';
import { Brain } from 'lucide-react';

interface AIAdvisorProps {
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
}

export default function AIAdvisor({ opportunities, isLoading }: AIAdvisorProps) {
  const { theme } = useTheme();
  // Analyze arbitrage opportunities to provide advice
  const advice = useMemo(() => {
    if (isLoading || !opportunities || opportunities.length === 0) {
      return {
        tradingRecommendation: "Insufficient data to make a recommendation at this time.",
        reasoningSummary: "Waiting for market data to become available.",
        confidence: 0,
        bestOpportunity: null,
        highestProfitToday: null,
        marketTrend: "neutral"
      };
    }

    // Sort opportunities by spread percentage
    const sortedOpportunities = [...opportunities].sort((a, b) => b.spreadPercentage - a.spreadPercentage);
    const bestOpportunity = sortedOpportunities[0];
    
    // Determine if now is a good time to trade
    let tradingRecommendation = "Neutral";
    let reasoningSummary = "";
    let confidence = 0;
    let marketTrend = "neutral";
    
    if (bestOpportunity.spreadPercentage >= 5) {
      tradingRecommendation = "Strong Buy";
      reasoningSummary = `Excellent arbitrage opportunity with a spread of ${formatPercentage(bestOpportunity.spreadPercentage)} between ${bestOpportunity.buyExchange} and ${bestOpportunity.sellExchange}.`;
      confidence = 90;
      marketTrend = "very_positive";
    } else if (bestOpportunity.spreadPercentage >= 3) {
      tradingRecommendation = "Buy";
      reasoningSummary = `Good arbitrage opportunity with a spread of ${formatPercentage(bestOpportunity.spreadPercentage)} between ${bestOpportunity.buyExchange} and ${bestOpportunity.sellExchange}.`;
      confidence = 75;
      marketTrend = "positive";
    } else if (bestOpportunity.spreadPercentage >= 1.5) {
      tradingRecommendation = "Consider Buying";
      reasoningSummary = `Moderate arbitrage opportunity with a spread of ${formatPercentage(bestOpportunity.spreadPercentage)} between ${bestOpportunity.buyExchange} and ${bestOpportunity.sellExchange}.`;
      confidence = 60;
      marketTrend = "neutral";
    } else {
      tradingRecommendation = "Hold";
      reasoningSummary = `Limited arbitrage opportunities at this time. The best spread is only ${formatPercentage(bestOpportunity.spreadPercentage)} between ${bestOpportunity.buyExchange} and ${bestOpportunity.sellExchange}.`;
      confidence = 65;
      marketTrend = "neutral";
    }
    
    return {
      tradingRecommendation,
      reasoningSummary,
      confidence,
      bestOpportunity,
      highestProfitToday: bestOpportunity,
      marketTrend
    };
  }, [opportunities, isLoading]);

  // Background and border colors based on market trend
  const getBackgroundStyles = () => {
    switch(advice.marketTrend) {
      case "very_positive": 
        return {
          backgroundColor: `${theme.colors.status.success}15`,
          borderColor: `${theme.colors.status.success}30`
        };
      case "positive": 
        return {
          backgroundColor: `${theme.colors.status.success}10`,
          borderColor: `${theme.colors.status.success}25`
        };
      case "neutral": 
        return {
          backgroundColor: `${theme.colors.status.info}10`,
          borderColor: `${theme.colors.status.info}25`
        };
      case "negative": 
        return {
          backgroundColor: `${theme.colors.status.warning}10`,
          borderColor: `${theme.colors.status.warning}25`
        };
      default: 
        return {
          backgroundColor: `${theme.colors.status.info}10`,
          borderColor: `${theme.colors.status.info}25`
        };
    }
  };

  // Text color based on market trend
  const getTextColor = () => {
    switch(advice.marketTrend) {
      case "very_positive": return theme.colors.status.success;
      case "positive": return theme.colors.status.success;
      case "neutral": return theme.colors.status.info;
      case "negative": return theme.colors.status.warning;
      default: return theme.colors.status.info;
    }
  };

  return (
    <Card className="mb-6" style={getBackgroundStyles()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: getTextColor() }}>
          <Brain className="h-5 w-5" />
          AI Trading Advisor
        </CardTitle>
        <CardDescription style={{ color: theme.colors.text.secondary }}>
          Real-time analysis and trading recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded w-3/4" style={{ backgroundColor: theme.colors.background.elevated }}></div>
            <div className="h-4 rounded w-1/2" style={{ backgroundColor: theme.colors.background.elevated }}></div>
            <div className="h-4 rounded w-5/6" style={{ backgroundColor: theme.colors.background.elevated }}></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold" style={{ color: theme.colors.text.primary }}>Recommendation:</div>
              <div className="font-bold text-lg" style={{ color: getTextColor() }}>{advice.tradingRecommendation}</div>
            </div>
            
            <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {advice.reasoningSummary}
            </div>
            
            {advice.bestOpportunity && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.colors.border.primary}` }}>
                <div className="text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>Today's Best Opportunity:</div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.text.secondary }}>Route:</span>
                  <span className="font-medium" style={{ color: theme.colors.text.primary }}>{`${advice.bestOpportunity.buyExchange} → ${advice.bestOpportunity.sellExchange}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.text.secondary }}>Spread:</span>
                  <span className="font-medium" style={{ color: theme.colors.text.primary }}>{formatZAR(advice.bestOpportunity.spread)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.text.secondary }}>Percentage:</span>
                  <span className="font-medium" style={{ color: theme.colors.text.primary }}>{formatPercentage(advice.bestOpportunity.spreadPercentage)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}