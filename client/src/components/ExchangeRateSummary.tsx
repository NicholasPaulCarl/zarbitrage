import { Skeleton } from '@/components/ui/skeleton';
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
  return (
    <div className="mb-6 h-full flex flex-col bg-white rounded-lg p-4">
      <div className="pb-2">
        <h3 className="text-base md:text-lg font-medium">Exchange Rate Summary</h3>
        <p className="text-sm text-gray-500">
          Real-time arbitrage rates and profit indicators
        </p>
      </div>
      
      {/* In mobile view: grid with 1 column (stacked), on larger screens: still stacked vertically */}
      <div className="grid grid-cols-1 gap-3 h-full">
        {/* USD/ZAR Exchange Rate */}
        <div className="bg-gray-50 p-3 rounded-lg min-w-0">
          <div className="flex items-center mb-1">
            <ArrowUpDown className="h-4 w-4 min-w-[16px] mr-1.5 text-gray-500" />
            <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">USD/ZAR Rate</div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div className="text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis" id="usd-zar-rate">
              {exchangeRate?.rate?.toFixed(2) || 'N/A'}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1 overflow-hidden text-ellipsis" id="fx-updated">
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
        <div className="bg-gray-50 p-3 rounded-lg min-w-0">
          <div className="flex items-center mb-1">
            <TrendingUp className="h-4 w-4 min-w-[16px] mr-1.5 text-gray-500" />
            <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">Best Opportunity</div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div className="text-xl md:text-2xl font-semibold text-green-600 overflow-hidden text-ellipsis" id="best-spread-percent">
              {bestOpportunity ? formatPercentage(bestOpportunity.spreadPercentage) : 'N/A'}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1 overflow-hidden text-ellipsis w-full" id="best-spread-exchanges">
            {loading ? (
              <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
            ) : (
              bestOpportunity?.route || 'No opportunity found'
            )}
          </div>
        </div>

        {/* Potential Profit */}
        <div className="bg-gray-50 p-3 rounded-lg min-w-0">
          <div className="flex items-center mb-1">
            <DollarSign className="h-4 w-4 min-w-[16px] mr-1.5 text-gray-500" />
            <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">Profit (1 BTC)</div>
          </div>
          {loading ? (
            <Skeleton className="h-7 md:h-8 w-20 md:w-24" />
          ) : (
            <div className="text-xl md:text-2xl font-semibold text-green-600 overflow-hidden text-ellipsis" id="potential-profit">
              {formatZAR(potentialProfit)}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1 overflow-hidden text-ellipsis">
            Before fees & transfers
          </div>
        </div>
      </div>
    </div>
  );
}
