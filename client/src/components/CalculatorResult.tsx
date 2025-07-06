import { CalculatorResult as CalculatorResultType } from "@/lib/types";
import { formatZAR, formatPercentage } from "@/lib/formatters";
import { ArrowRightLeft, Coins, TrendingUp, TrendingDown, Ban } from "lucide-react";
import { Progress, Card, CardContent, useTheme } from "@/components/dark-ui";

interface CalculatorResultProps {
  result: CalculatorResultType | null;
}

export function CalculatorResult({ result }: CalculatorResultProps) {
  const { theme } = useTheme();
  
  if (!result) {
    return (
      <div 
        className="flex flex-col items-center justify-center text-center space-y-4"
        style={{ height: '400px' }}
      >
        <Ban 
          className="h-12 w-12" 
          style={{ color: theme.colors.text.secondary, opacity: 0.5 }}
        />
        <div>
          <p style={{ fontWeight: '500', color: theme.colors.text.secondary }}>No calculation yet</p>
          <p style={{ fontSize: '0.875rem', color: theme.colors.text.secondary, opacity: 0.7 }}>
            Fill in the form and click "Calculate Profit" to see results
          </p>
        </div>
      </div>
    );
  }

  const isProfit = result.netProfit > 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card 
        style={{
          borderWidth: '2px',
          borderColor: isProfit ? `${theme.colors.status.success}80` : `${theme.colors.status.error}80`,
          backgroundColor: isProfit ? `${theme.colors.status.success}10` : `${theme.colors.status.error}10`
        }}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              {isProfit ? (
                <TrendingUp 
                  className="h-8 w-8" 
                  style={{ color: theme.colors.status.success }}
                />
              ) : (
                <TrendingDown 
                  className="h-8 w-8" 
                  style={{ color: theme.colors.status.error }}
                />
              )}
            </div>
            <h3 
              className="font-semibold text-lg"
              style={{ color: theme.colors.text.primary }}
            >
              {isProfit ? "Profitable Opportunity" : "Not Profitable"}
            </h3>
            <p 
              className="text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              {isProfit 
                ? "This opportunity will generate a profit after all fees" 
                : "This opportunity will result in a loss after all fees"}
            </p>
            <div 
              className="text-2xl font-bold mt-2"
              style={{ color: isProfit ? theme.colors.status.success : theme.colors.status.error }}
            >
              {formatZAR(result.netProfit)}
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: isProfit ? theme.colors.status.success : theme.colors.status.error }}
            >
              {formatPercentage(result.netProfitPercentage)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Details */}
      <div className="space-y-4">
        <div 
          className="flex items-center space-x-2 text-sm"
          style={{ color: theme.colors.text.secondary }}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>
            {result.buyExchange} → {result.sellExchange}
          </span>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p 
              className="text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              Buy Price (ZAR)
            </p>
            <p 
              className="font-medium"
              style={{ color: theme.colors.text.primary }}
            >
              {formatZAR(result.buyPrice)}
            </p>
          </div>
          <div className="space-y-1">
            <p 
              className="text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              Sell Price (ZAR)
            </p>
            <p 
              className="font-medium"
              style={{ color: theme.colors.text.primary }}
            >
              {formatZAR(result.sellPrice)}
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {/* Investment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Investment Amount
              </p>
              <p 
                className="font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                {formatZAR(result.investmentAmount)}
              </p>
            </div>
            <Progress size="sm" value={100} />
          </div>

          {/* Fees breakdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Buy Fee ({result.buyFeePercentage}%)
              </p>
              <p 
                className="font-medium"
                style={{ color: theme.colors.status.error }}
              >
                -{formatZAR(result.buyFeeAmount)}
              </p>
            </div>
            <div 
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <div 
                className="h-full" 
                style={{ 
                  backgroundColor: theme.colors.status.error,
                  width: `${(result.buyFeeAmount / result.totalFees) * 100}%` 
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Sell Fee ({result.sellFeePercentage}%)
              </p>
              <p 
                className="font-medium"
                style={{ color: theme.colors.status.error }}
              >
                -{formatZAR(result.sellFeeAmount)}
              </p>
            </div>
            <div 
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <div 
                className="h-full" 
                style={{ 
                  backgroundColor: theme.colors.status.error,
                  width: `${(result.sellFeeAmount / result.totalFees) * 100}%` 
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Transfer Fee
              </p>
              <p 
                className="font-medium"
                style={{ color: theme.colors.status.error }}
              >
                -{formatZAR(result.transferFee)}
              </p>
            </div>
            <div 
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <div 
                className="h-full" 
                style={{ 
                  backgroundColor: theme.colors.status.error,
                  width: `${(result.transferFee / result.totalFees) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Profit breakdown */}
          <div 
            className="space-y-1 pt-2 border-t"
            style={{ borderColor: theme.colors.border.primary }}
          >
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Gross Profit (before fees)
              </p>
              <p 
                className="font-medium"
                style={{ 
                  color: result.grossProfit > 0 ? theme.colors.status.success : theme.colors.status.error
                }}
              >
                {formatZAR(result.grossProfit)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Total Fees
              </p>
              <p 
                className="font-medium"
                style={{ color: theme.colors.status.error }}
              >
                -{formatZAR(result.totalFees)}
              </p>
            </div>
          </div>

          <div 
            className="space-y-1 pt-2 border-t"
            style={{ borderColor: theme.colors.border.primary }}
          >
            <div className="flex items-center justify-between font-semibold">
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.primary }}
              >
                Net Profit (after fees)
              </p>
              <p 
                style={{ 
                  color: result.netProfit > 0 ? theme.colors.status.success : theme.colors.status.error
                }}
              >
                {formatZAR(result.netProfit)}
              </p>
            </div>
            <div 
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.background.tertiary }}
            >
              <div 
                className="h-full"
                style={{ 
                  backgroundColor: result.netProfit > 0 ? theme.colors.status.success : theme.colors.status.error,
                  width: `${Math.abs((result.netProfit / result.investmentAmount) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}