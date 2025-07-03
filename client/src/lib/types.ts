export interface Exchange {
  name: string;
  price: number;
  currency: "USD" | "ZAR";
  timestamp?: string;
}

export interface ExchangeRate {
  rate: number;
  timestamp?: string;
}

export interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  route: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
}

export interface AlertHistoryItem {
  id: number;
  route: string;
  spread: number;
  spreadPercentage: number;
  timestamp: string;
}

export interface ArbitrageData {
  exchangeRate: ExchangeRate;
  internationalExchanges: Exchange[];
  localExchanges: Exchange[];
  opportunities: ArbitrageOpportunity[];
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

export interface ExchangeFee {
  name: string;
  tradingFeePercentage: number;
  withdrawalFeeUSD?: number;
  withdrawalFeeZAR?: number;
}

export interface CalculatorInput {
  opportunityId?: string;
  buyExchange?: string;
  sellExchange?: string;
  amount: number;
  customBuyFee?: number;
  customSellFee?: number;
  transferFee?: number;
}

export interface CalculatorResult {
  buyExchange: string;
  sellExchange: string;
  investmentAmount: number;
  buyPrice: number;
  sellPrice: number;
  buyFeePercentage: number;
  sellFeePercentage: number;
  transferFee: number;
  buyFeeAmount: number;
  sellFeeAmount: number;
  totalFees: number;
  grossProfit: number;
  netProfit: number;
  netProfitPercentage: number;
  isProfit: boolean;
}
