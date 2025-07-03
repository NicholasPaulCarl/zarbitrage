import { 
  ExchangeFee, 
  CalculatorInput, 
  CalculatorResult, 
  ArbitrageOpportunity 
} from "@shared/schema";

// Exchange fee data - these would typically come from a database or API
const exchangeFees: ExchangeFee[] = [
  { name: "Binance", tradingFeePercentage: 0.10, withdrawalFeeUSD: 20 },
  { name: "Bitfinex", tradingFeePercentage: 0.20, withdrawalFeeUSD: 25 },
  { name: "Bitstamp", tradingFeePercentage: 0.25, withdrawalFeeUSD: 22 },
  { name: "Kraken", tradingFeePercentage: 0.16, withdrawalFeeUSD: 21 },
  { name: "KuCoin", tradingFeePercentage: 0.10, withdrawalFeeUSD: 20 },
  { name: "ChainEX", tradingFeePercentage: 0.15, withdrawalFeeZAR: 300 },
  { name: "AltcoinTrader", tradingFeePercentage: 0.20, withdrawalFeeZAR: 350 },
  { name: "Ovex", tradingFeePercentage: 0.15, withdrawalFeeZAR: 300 },
  { name: "VALR", tradingFeePercentage: 0.10, withdrawalFeeZAR: 250 },
  { name: "LUNO", tradingFeePercentage: 0.25, withdrawalFeeZAR: 400 }
];

/**
 * Get all exchange fees
 */
export function getExchangeFees(): ExchangeFee[] {
  return exchangeFees;
}

/**
 * Get a specific exchange's fee data
 */
export function getExchangeFee(exchangeName: string): ExchangeFee | undefined {
  return exchangeFees.find(fee => fee.name === exchangeName);
}

/**
 * Calculate arbitrage profit based on input parameters and current prices
 */
export function calculateArbitrageProfit(
  input: CalculatorInput,
  opportunity: ArbitrageOpportunity,
  exchangeRate: number
): CalculatorResult {
  // Get exchange fees
  const buyExchangeFee = getExchangeFee(opportunity.buyExchange);
  const sellExchangeFee = getExchangeFee(opportunity.sellExchange);
  
  if (!buyExchangeFee || !sellExchangeFee) {
    throw new Error("Exchange fee data not found");
  }
  
  // Use custom fees if provided, otherwise use the default fee percentages
  const buyFeePercentage = input.customBuyFee !== undefined ? input.customBuyFee : buyExchangeFee.tradingFeePercentage;
  const sellFeePercentage = input.customSellFee !== undefined ? input.customSellFee : sellExchangeFee.tradingFeePercentage;
  const transferFee = input.transferFee || 0;
  
  // Calculate the amount of BTC that can be bought with the investment amount
  const investmentAmount = input.amount;
  const buyPrice = opportunity.buyPrice;
  const sellPrice = opportunity.sellPrice;
  
  // Calculate BTC amount after buy fee
  const buyFeeAmount = (investmentAmount * buyFeePercentage) / 100;
  const netInvestmentAmount = investmentAmount - buyFeeAmount;
  const btcAmount = netInvestmentAmount / buyPrice;
  
  // Calculate sale proceeds after sell fee
  const grossSaleProceeds = btcAmount * sellPrice;
  const sellFeeAmount = (grossSaleProceeds * sellFeePercentage) / 100;
  const netSaleProceeds = grossSaleProceeds - sellFeeAmount - transferFee;
  
  // Calculate profits
  const grossProfit = grossSaleProceeds - investmentAmount;
  const netProfit = netSaleProceeds - investmentAmount;
  const netProfitPercentage = (netProfit / investmentAmount) * 100;
  const totalFees = buyFeeAmount + sellFeeAmount + transferFee;
  
  return {
    buyExchange: opportunity.buyExchange,
    sellExchange: opportunity.sellExchange,
    investmentAmount,
    buyPrice,
    sellPrice,
    buyFeePercentage,
    sellFeePercentage,
    transferFee,
    buyFeeAmount,
    sellFeeAmount,
    totalFees,
    grossProfit,
    netProfit,
    netProfitPercentage,
    isProfit: netProfit > 0
  };
}