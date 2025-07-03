import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArbitrageOpportunity } from '@/lib/types';
import { formatZAR, formatPercentage } from '@/lib/formatters';
import { Brain } from 'lucide-react';

interface AIAdvisorProps {
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
}

export default function AIAdvisor({ opportunities, isLoading }: AIAdvisorProps) {
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

  // Background color based on market trend
  const getBgColorClass = () => {
    switch(advice.marketTrend) {
      case "very_positive": return "bg-green-50 border-green-200";
      case "positive": return "bg-emerald-50 border-emerald-200";
      case "neutral": return "bg-blue-50 border-blue-200";
      case "negative": return "bg-orange-50 border-orange-200";
      default: return "bg-blue-50 border-blue-200";
    }
  };

  // Text color based on market trend
  const getTextColorClass = () => {
    switch(advice.marketTrend) {
      case "very_positive": return "text-green-800";
      case "positive": return "text-emerald-800";
      case "neutral": return "text-blue-800";
      case "negative": return "text-orange-800";
      default: return "text-blue-800";
    }
  };

  return (
    <Card className={`mb-6 border ${getBgColorClass()}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${getTextColorClass()}`}>
          <Brain className="h-5 w-5" />
          AI Trading Advisor
        </CardTitle>
        <CardDescription className="text-gray-600">
          Real-time analysis and trading recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Recommendation:</div>
              <div className={`font-bold text-lg ${getTextColorClass()}`}>{advice.tradingRecommendation}</div>
            </div>
            
            <div className="text-sm text-gray-700">
              {advice.reasoningSummary}
            </div>
            
            {advice.bestOpportunity && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium mb-1">Today's Best Opportunity:</div>
                <div className="flex justify-between text-sm">
                  <span>Route:</span>
                  <span className="font-medium">{`${advice.bestOpportunity.buyExchange} → ${advice.bestOpportunity.sellExchange}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Spread:</span>
                  <span className="font-medium">{formatZAR(advice.bestOpportunity.spread)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Percentage:</span>
                  <span className="font-medium">{formatPercentage(advice.bestOpportunity.spreadPercentage)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}