import { useState } from 'react';
import { Card, CardContent, Button, Badge, useTheme } from '@/components/dark-ui';
import { formatZAR, formatPercentage } from '@/lib/formatters';
import { ArbitrageOpportunity } from '@/lib/types';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Building2,
  TrendingUp,
  Eye,
  Heart
} from 'lucide-react';

interface ArbitrageOpportunityCardProps {
  opportunity: ArbitrageOpportunity;
  isAboveThreshold: boolean;
  isUpdated?: boolean;
  changeDirection?: {
    spread: number;
    percentage: number;
  };
}

// Helper function to convert ZAR to USD (using approximate rate)
const convertZARToUSD = (zarAmount: number): number => {
  // Using approximate rate of 18.5 ZAR = 1 USD
  // In production, this should fetch real-time exchange rate
  const USD_ZAR_RATE = 18.5;
  return zarAmount / USD_ZAR_RATE;
};

// Helper function to format USD
const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Exchange logo placeholder component
const ExchangeLogo = ({ exchangeName, size = 'md', theme }: { exchangeName: string; size?: 'sm' | 'md' | 'lg'; theme: any }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const getExchangeColors = (name: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'Binance': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
      'LUNO': { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
      'VALR': { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
      'Bitstamp': { bg: theme.colors.background.elevated, text: theme.colors.text.primary, border: theme.colors.border.light },
      'Bitfinex': { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
      'Kraken': { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
      'KuCoin': { bg: '#E6FFFA', text: '#134E4A', border: '#14B8A6' },
      'AltcoinTrader': { bg: '#FED7AA', text: '#9A3412', border: '#F97316' }
    };
    return colors[name] || { bg: theme.colors.background.elevated, text: theme.colors.text.primary, border: theme.colors.border.light };
  };

  const exchangeColors = getExchangeColors(exchangeName);

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold border-2 shadow-sm ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: exchangeColors.bg,
        color: exchangeColors.text,
        borderColor: exchangeColors.border
      }}
    >
      <Building2 className={`h-3 w-3 ${size === 'lg' ? 'h-5 w-5' : ''} ${size === 'sm' ? 'h-2 w-2' : ''}`} />
    </div>
  );
};

export default function ArbitrageOpportunityCard({
  opportunity,
  isAboveThreshold,
  isUpdated = false,
  changeDirection
}: ArbitrageOpportunityCardProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const cardStyles = {
    transition: 'all 0.25s ease-in-out',
    cursor: 'pointer',
    backgroundColor: theme.colors.background.tertiary,
    border: `2px solid ${theme.colors.border.primary}`, // Always 2px to prevent layout shift
    boxSizing: 'border-box' as const, // Prevent border from affecting dimensions
    display: 'flex',
    flexDirection: 'column' as const,
    ...(isAboveThreshold && {
      borderColor: `${theme.colors.status.success}30`,
      backgroundColor: `${theme.colors.status.success}10`
    }),
    ...(isUpdated && {
      borderColor: `${theme.colors.primary.main}30`,
      backgroundColor: `${theme.colors.primary.main}10`
    }),
    ...(isExpanded && {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    })
  };

  return (
    <Card padding="none" variant="default" style={cardStyles}>
      <CardContent className="p-0">
        {/* Collapsed Header - Always Visible */}
        <div 
          className="p-3 flex items-center justify-between transition-colors duration-[250ms]"
          style={{
            backgroundColor: isHovered ? theme.colors.background.tertiary : 'transparent',
            minHeight: '60px' // Ensure consistent height
          }}
          onClick={toggleExpanded}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center space-x-3">
            {/* Exchange Names with Arrow */}
            <div className="flex items-center space-x-2">
              <span 
                className="text-sm font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                {opportunity.buyExchange}
              </span>
              <ArrowRight 
                className="h-4 w-4" 
                style={{ color: theme.colors.text.secondary }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                {opportunity.sellExchange}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Spread Amount */}
            <div className="text-right">
              <div 
                className="text-sm font-semibold transition-colors duration-[250ms]"
                style={{
                  color: isUpdated && changeDirection?.spread && changeDirection.spread > 0 ? theme.colors.status.success :
                         isUpdated && changeDirection?.spread && changeDirection.spread < 0 ? theme.colors.status.error :
                         theme.colors.status.success
                }}
              >
                {formatZAR(opportunity.spread)}
                {isUpdated && changeDirection?.spread && changeDirection.spread > 0 && (
                  <ArrowUp 
                    className="inline-block ml-1 h-3 w-3" 
                    style={{ color: theme.colors.status.success }}
                  />
                )}
                {isUpdated && changeDirection?.spread && changeDirection.spread < 0 && (
                  <ArrowDown 
                    className="inline-block ml-1 h-3 w-3" 
                    style={{ color: theme.colors.status.error }}
                  />
                )}
              </div>
            </div>


            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronUp 
                className="h-4 w-4" 
                style={{ color: theme.colors.text.secondary }}
              />
            ) : (
              <ChevronDown 
                className="h-4 w-4" 
                style={{ color: theme.colors.text.secondary }}
              />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div 
            className="p-3 space-y-3 animate-in slide-in-from-top-2 duration-[250ms]"
            style={{
              borderTop: `1px solid ${theme.colors.border.primary}`
            }}
          >
            {/* Exchange Logos Side by Side with Prices */}
            <div className="flex items-center justify-between">
              {/* Buy Exchange */}
              <div className="flex flex-col items-center space-y-1 flex-1">
                <ExchangeLogo exchangeName={opportunity.buyExchange} size="md" theme={theme} />
                <div className="text-center">
                  <div 
                    className="text-xs uppercase tracking-wide"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Buy from
                  </div>
                  <div 
                    className="font-semibold text-sm"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {opportunity.buyExchange}
                  </div>
                </div>
                <div className="text-left">
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    USD: <span 
                      className="font-medium"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {formatUSD(convertZARToUSD(opportunity.buyPrice))}
                    </span>
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    ZAR: <span 
                      className="font-medium"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {formatZAR(opportunity.buyPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center space-y-1 px-2">
                <ArrowRight 
                  className="h-5 w-5" 
                  style={{ color: theme.colors.status.success }}
                />
                <div 
                  className="text-xs font-medium"
                  style={{ color: theme.colors.status.success }}
                >
                  Transfer
                </div>
              </div>

              {/* Sell Exchange */}
              <div className="flex flex-col items-center space-y-1 flex-1">
                <ExchangeLogo exchangeName={opportunity.sellExchange} size="md" theme={theme} />
                <div className="text-center">
                  <div 
                    className="text-xs uppercase tracking-wide"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Sell on
                  </div>
                  <div 
                    className="font-semibold text-sm"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {opportunity.sellExchange}
                  </div>
                </div>
                <div className="text-left">
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    USD: <span 
                      className="font-medium"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {formatUSD(convertZARToUSD(opportunity.sellPrice))}
                    </span>
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    ZAR: <span 
                      className="font-medium"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {formatZAR(opportunity.sellPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Summary */}
            <div 
              className="rounded-lg p-2"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Potential Profit
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.status.success }}
                  >
                    {formatZAR(opportunity.spread)}
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Margin
                  </div>
                  <div 
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.status.success }}
                  >
                    {formatPercentage(opportunity.spreadPercentage)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full sm:flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Execute Trade
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full sm:flex-1"
              >
                <Heart className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4" />
                <span className="ml-2 sm:hidden">View Details</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}