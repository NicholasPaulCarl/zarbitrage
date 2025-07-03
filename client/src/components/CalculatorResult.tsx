import { CalculatorResult as CalculatorResultType } from "@/lib/types";
import { formatZAR, formatPercentage } from "@/lib/formatters";
import { ArrowRightLeft, Coins, TrendingUp, TrendingDown, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalculatorResultProps {
  result: CalculatorResultType | null;
}

export function CalculatorResult({ result }: CalculatorResultProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[400px] space-y-4">
        <Ban className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">No calculation yet</p>
          <p className="text-sm text-muted-foreground/70">
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
      <Card className={cn(
        "border-2",
        isProfit ? "border-green-500/50 bg-green-50/50" : "border-red-500/50 bg-red-50/50"
      )}>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              {isProfit ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
            <h3 className="font-semibold text-lg">
              {isProfit ? "Profitable Opportunity" : "Not Profitable"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isProfit 
                ? "This opportunity will generate a profit after all fees" 
                : "This opportunity will result in a loss after all fees"}
            </p>
            <div className={cn(
              "text-2xl font-bold mt-2",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {formatZAR(result.netProfit)}
            </div>
            <div className={cn(
              "text-sm font-medium",
              isProfit ? "text-green-600" : "text-red-600"
            )}>
              {formatPercentage(result.netProfitPercentage)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Details */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <ArrowRightLeft className="h-4 w-4" />
          <span>
            {result.buyExchange} → {result.sellExchange}
          </span>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Buy Price (ZAR)</p>
            <p className="font-medium">{formatZAR(result.buyPrice)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sell Price (ZAR)</p>
            <p className="font-medium">{formatZAR(result.sellPrice)}</p>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {/* Investment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Investment Amount</p>
              <p className="font-medium">{formatZAR(result.investmentAmount)}</p>
            </div>
            <Progress className="h-2" value={100} />
          </div>

          {/* Fees breakdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Buy Fee ({result.buyFeePercentage}%)</p>
              <p className="font-medium text-red-600">-{formatZAR(result.buyFeeAmount)}</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400" 
                style={{ width: `${(result.buyFeeAmount / result.totalFees) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Sell Fee ({result.sellFeePercentage}%)</p>
              <p className="font-medium text-red-600">-{formatZAR(result.sellFeeAmount)}</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400" 
                style={{ width: `${(result.sellFeeAmount / result.totalFees) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Transfer Fee</p>
              <p className="font-medium text-red-600">-{formatZAR(result.transferFee)}</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400" 
                style={{ width: `${(result.transferFee / result.totalFees) * 100}%` }}
              />
            </div>
          </div>

          {/* Profit breakdown */}
          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm">Gross Profit (before fees)</p>
              <p className={cn(
                "font-medium",
                result.grossProfit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatZAR(result.grossProfit)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm">Total Fees</p>
              <p className="font-medium text-red-600">-{formatZAR(result.totalFees)}</p>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-center justify-between font-semibold">
              <p className="text-sm">Net Profit (after fees)</p>
              <p className={cn(
                result.netProfit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatZAR(result.netProfit)}
              </p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${result.netProfit > 0 ? "bg-green-400" : "bg-red-400"}`}
                style={{ width: `${Math.abs((result.netProfit / result.investmentAmount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}