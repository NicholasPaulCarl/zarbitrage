import axios from "axios";
import { Exchange, ExchangeRate, ArbitrageOpportunity } from "@shared/schema";

interface ExchangeApiRequest {
  name: string;
  request: () => Promise<any>;
  parser: (data: any) => number;
  isMock: boolean;
}

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Helper function to get cached data or fetch fresh data
async function getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
  } catch (error) {
    // If fetch fails but we have cached data, return it even if expired
    if (cached) {
      console.log(`Using expired cache for ${key} due to fetch error`);
      return cached.data;
    }
    throw error;
  }
}

// Configure axios with better timeout and retry settings
const axiosConfig = {
  timeout: 5000, // 5 second timeout
  headers: {
    'User-Agent': 'ArbitrageTracker/1.0'
  }
};

// Fetch USD to ZAR exchange rate
export async function getExchangeRate(): Promise<ExchangeRate> {
  return getCachedData('exchange-rate', async () => {
    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD", axiosConfig);
    const zarRate = response.data.rates.ZAR;

    if (!zarRate) {
      throw new Error("Failed to get ZAR exchange rate");
    }

    return {
      rate: zarRate,
      timestamp: new Date().toISOString()
    };
  });
}

// Fetch BTC prices from international exchanges (USD)
export async function getInternationalPrices(): Promise<Exchange[]> {
  return getCachedData('international-prices', async () => {
    const exchanges: Exchange[] = [];
    
    // Define reliable exchange API endpoints (removed problematic ones)
    const apiRequests: ExchangeApiRequest[] = [
      { 
        name: "Bitstamp", 
        request: () => axios.get("https://www.bitstamp.net/api/v2/ticker/btcusd/", axiosConfig),
        parser: (data: any) => parseFloat(data.last),
        isMock: false
      },
      { 
        name: "Bitfinex", 
        request: () => axios.get("https://api-pub.bitfinex.com/v2/ticker/tBTCUSD", axiosConfig),
        parser: (data: any) => data[6],
        isMock: false
      },
      { 
        name: "Binance", 
        request: () => axios.get("https://api.binance.us/api/v3/ticker/price?symbol=BTCUSD", axiosConfig),
        parser: (data: any) => parseFloat(data.price),
        isMock: false
      },
      { 
        name: "Kraken", 
        request: () => axios.get("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", axiosConfig),
        parser: (data: any) => parseFloat(data.result.XXBTZUSD.c[0]),
        isMock: false
      },
      { 
        name: "KuCoin", 
        request: () => axios.get("https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT", axiosConfig),
        parser: (data: any) => parseFloat(data.data.last),
        isMock: false
      }
    ];

    const timestamp = new Date().toISOString();

    // Use Promise.allSettled for better error handling
    const results = await Promise.allSettled(
      apiRequests.map(async (exchange) => {
        const response = await exchange.request();
        const price = exchange.parser(response.data);
        
        if (!isNaN(price) && price > 0) {
          console.log(`Successfully retrieved ${exchange.name} price: ${price} USD`);
          return {
            name: exchange.name,
            price,
            currency: "USD" as const,
            timestamp
          };
        }
        throw new Error(`Invalid price data from ${exchange.name}`);
      })
    );

    // Process results and add successful exchanges
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        exchanges.push(result.value);
      } else {
        console.error(`Error fetching ${apiRequests[index].name} data:`, result.reason?.message || 'Unknown error');
      }
    });

    return exchanges;
  });
}

// Fetch BTC prices from South African exchanges (ZAR)
export async function getLocalPrices(): Promise<Exchange[]> {
  return getCachedData('local-prices', async () => {
    const exchanges: Exchange[] = [];
    
    // Define reliable local exchange APIs (removed problematic rate-limited ones)
    const apiRequests: ExchangeApiRequest[] = [
      { 
        name: "LUNO", 
        request: () => axios.get("https://api.luno.com/api/1/ticker?pair=XBTZAR", axiosConfig),
        parser: (data: any) => parseFloat(data.last_trade),
        isMock: false
      },
      { 
        name: "VALR", 
        request: () => axios.get("https://api.valr.com/v1/public/BTCZAR/marketsummary", axiosConfig),
        parser: (data: any) => parseFloat(data.lastTradedPrice),
        isMock: false
      },
      { 
        name: "AltcoinTrader", 
        request: () => axios.get("https://api.altcointrader.co.za/v3/live-stats", axiosConfig),
        parser: (data: any) => data.BTC ? parseFloat(data.BTC.Price) : 0,
        isMock: false
      }
    ];

    const timestamp = new Date().toISOString();

    // Use Promise.allSettled for better error handling
    const results = await Promise.allSettled(
      apiRequests.map(async (exchange) => {
        const response = await exchange.request();
        const price = exchange.parser(response.data);
        
        if (!isNaN(price) && price > 0) {
          console.log(`Successfully retrieved ${exchange.name} price: ${price} ZAR`);
          return {
            name: exchange.name,
            price,
            currency: "ZAR" as const,
            timestamp
          };
        }
        throw new Error(`Invalid price data from ${exchange.name}`);
      })
    );

    // Process results and add successful exchanges
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        exchanges.push(result.value);
      } else {
        console.error(`Error fetching ${apiRequests[index].name} data:`, result.reason?.message || 'Unknown error');
      }
    });

    return exchanges;
  });
}

// Calculate arbitrage opportunities
export function calculateArbitrageOpportunities(
  internationalExchanges: Exchange[],
  localExchanges: Exchange[],
  exchangeRate: number
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  internationalExchanges.forEach(intExchange => {
    // Convert USD price to ZAR
    const priceInZAR = intExchange.price * exchangeRate;

    localExchanges.forEach(localExchange => {
      const spread = localExchange.price - priceInZAR;
      const spreadPercentage = (spread / priceInZAR) * 100;

      opportunities.push({
        buyExchange: intExchange.name,
        sellExchange: localExchange.name,
        route: `${intExchange.name} → ${localExchange.name}`,
        buyPrice: priceInZAR,
        sellPrice: localExchange.price,
        spread: spread,
        spreadPercentage: spreadPercentage
      });
    });
  });

  // Sort by spread percentage (descending)
  return opportunities.sort((a, b) => b.spreadPercentage - a.spreadPercentage);
}
