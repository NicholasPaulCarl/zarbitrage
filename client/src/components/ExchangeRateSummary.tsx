import { Skeleton } from '@/components/dark-ui';
import { useTheme } from '@/components/dark-ui';
import { formatZAR, formatPercentage, formatRelativeTime } from '@/lib/formatters';
import { ExchangeRate, ArbitrageOpportunity } from '@/lib/types';
import { ArrowUpDown, TrendingUp, DollarSign } from 'lucide-react';

interface ExchangeRateSummaryProps {
  exchangeRate: ExchangeRate;
  bestOpportunity: ArbitrageOpportunity | null;
  potentialProfit: number;
  loading: boolean;
}

export default function ExchangeRateSummary({
  exchangeRate,
  bestOpportunity,
  potentialProfit,
  loading
}: ExchangeRateSummaryProps) {
  const { theme } = useTheme();
  return (
    <div 
      className="mb-6 h-full flex flex-col rounded-lg p-4"
      style={{ backgroundColor: theme.colors.background.tertiary }}
    >
      <div className="pb-2">
        <h3 
          className="text-base md:text-lg font-medium"
          style={{ color: theme.colors.text.primary }}
        >
          Exchange Rate Summary
        </h3>
        <p 
          className="text-sm"
          style={{ color: theme.colors.text.secondary }}
        >
          Real-time arbitrage rates and profit indicators
        </p>
      </div>
      
      {/* In mobile view: grid with 1 column (stacked), on larger screens: still stacked vertically */}
      <div className="grid grid-cols-1 gap-3 h-full">
        {/* USD/ZAR Exchange Rate */}
        <div 
          className="p-3 rounded-lg min-w-0"
          style={{ backgroundColor: theme.colors.background.elevated }}
        >
          <div className="flex items-center mb-1">
            <ArrowUpDown 
              className="h-4 w-4 min-w-[16px] mr-1.5" 
              style={{ color: theme.colors.text.secondary }}
            />
            <div 
              className="text-xs md:text-sm whitespace-nowrap"
              style={{ color: theme.colors.text.secondary }}
            >
              USD/ZAR Rate
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div 
              className="text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis" 
              style={{ color: theme.colors.text.primary }}
              id="usd-zar-rate"
            >
              {exchangeRate?.rate?.toFixed(2) || 'N/A'}
            </div>
          )}
          <div 
            className="text-xs mt-1 overflow-hidden text-ellipsis"
            style={{ color: theme.colors.text.tertiary }}
            id="fx-updated"
          >
            {loading ? (
              <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
            ) : (
              exchangeRate?.timestamp ? 
                `Updated: ${formatRelativeTime(exchangeRate.timestamp)}` : 
                'Updating...'
            )}
          </div>
        </div>

        {/* Best Arbitrage Opportunity */}
        <div 
          className="p-3 rounded-lg min-w-0"
          style={{ backgroundColor: theme.colors.background.elevated }}
        >
          <div className="flex items-center mb-1">
            <TrendingUp 
              className="h-4 w-4 min-w-[16px] mr-1.5" 
              style={{ color: theme.colors.text.secondary }}
            />
            <div 
              className="text-xs md:text-sm whitespace-nowrap"
              style={{ color: theme.colors.text.secondary }}
            >
              Best Opportunity
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div 
              className="text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis" 
              style={{ color: theme.colors.status.success }}
              id="best-spread-percent"
            >
              {bestOpportunity ? formatPercentage(bestOpportunity.spreadPercentage) : 'N/A'}
            </div>
          )}
          <div 
            className="text-xs mt-1 overflow-hidden text-ellipsis w-full"
            style={{ color: theme.colors.text.secondary }}
            id="best-spread-exchanges"
          >
            {loading ? (
              <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
            ) : (
              bestOpportunity?.route || 'No opportunity found'
            )}
          </div>
        </div>

        {/* Potential Profit */}
        <div 
          className="p-3 rounded-lg min-w-0"
          style={{ backgroundColor: theme.colors.background.elevated }}
        >
          <div className="flex items-center mb-1">
            <DollarSign 
              className="h-4 w-4 min-w-[16px] mr-1.5" 
              style={{ color: theme.colors.text.secondary }}
            />
            <div 
              className="text-xs md:text-sm whitespace-nowrap"
              style={{ color: theme.colors.text.secondary }}
            >
              Profit (1 BTC)
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div 
              className="text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis" 
              style={{ color: theme.colors.status.success }}
              id="potential-profit"
            >
              {formatZAR(potentialProfit)}
            </div>
          )}
          <div 
            className="text-xs mt-1 overflow-hidden text-ellipsis"
            style={{ color: theme.colors.text.tertiary }}
          >
            Before fees & transfers
          </div>
        </div>
      </div>
    </div>
  );
}
