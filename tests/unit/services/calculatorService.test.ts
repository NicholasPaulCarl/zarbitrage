import { describe, it, expect } from 'vitest';
import { 
  getExchangeFees, 
  getExchangeFee, 
  calculateArbitrageProfit 
} from '@server/services/calculatorService';
import { CalculatorInput, ArbitrageOpportunity } from '@shared/schema';

describe('Calculator Service', () => {
  describe('getExchangeFees', () => {
    it('should return an array of exchange fees', () => {
      const fees = getExchangeFees();
      expect(fees).toBeInstanceOf(Array);
      expect(fees.length).toBeGreaterThan(0);
    });

    it('should include expected exchanges', () => {
      const fees = getExchangeFees();
      const exchangeNames = fees.map(fee => fee.name);
      
      expect(exchangeNames).toContain('Binance');
      expect(exchangeNames).toContain('LUNO');
      expect(exchangeNames).toContain('VALR');
      expect(exchangeNames).toContain('Kraken');
    });

    it('should have valid fee structures', () => {
      const fees = getExchangeFees();
      
      fees.forEach(fee => {
        expect(fee.name).toBeDefined();
        expect(fee.tradingFeePercentage).toBeGreaterThanOrEqual(0);
        expect(fee.tradingFeePercentage).toBeLessThanOrEqual(10); // Reasonable upper bound
        
        // Should have either USD or ZAR withdrawal fee
        expect(fee.withdrawalFeeUSD || fee.withdrawalFeeZAR).toBeDefined();
      });
    });
  });

  describe('getExchangeFee', () => {
    it('should return the correct exchange fee for a valid exchange', () => {
      const binanceFee = getExchangeFee('Binance');
      
      expect(binanceFee).toBeDefined();
      expect(binanceFee?.name).toBe('Binance');
      expect(binanceFee?.tradingFeePercentage).toBe(0.10);
      expect(binanceFee?.withdrawalFeeUSD).toBe(20);
    });

    it('should return undefined for non-existent exchange', () => {
      const invalidFee = getExchangeFee('NonExistentExchange');
      expect(invalidFee).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const binanceFee = getExchangeFee('binance'); // lowercase
      expect(binanceFee).toBeUndefined();
    });
  });

  describe('calculateArbitrageProfit', () => {
    const mockOpportunity: ArbitrageOpportunity = {
      buyExchange: 'Binance',
      sellExchange: 'LUNO',
      buyPrice: 45000, // USD
      sellPrice: 850000, // ZAR  
      spread: 5000,
      route: 'Binance → LUNO'
    };

    const baseInput: CalculatorInput = {
      amount: 10000, // $10,000 investment
    };

    it('should calculate basic arbitrage profit correctly', () => {
      const result = calculateArbitrageProfit(baseInput, mockOpportunity, 18.5); // USD/ZAR rate
      
      expect(result.buyExchange).toBe('Binance');
      expect(result.sellExchange).toBe('LUNO');
      expect(result.investmentAmount).toBe(10000);
      expect(result.buyPrice).toBe(45000);
      expect(result.sellPrice).toBe(850000);
      
      // Check fee calculations
      expect(result.buyFeePercentage).toBe(0.10); // Binance default
      expect(result.sellFeePercentage).toBe(0.25); // LUNO default
      expect(result.buyFeeAmount).toBe(10); // 0.1% of $10,000
      
      // Check BTC calculation
      const expectedBtcAmount = (10000 - 10) / 45000; // Net investment / buy price
      const expectedGrossSale = expectedBtcAmount * 850000;
      const expectedSellFee = (expectedGrossSale * 0.25) / 100;
      const expectedNetSale = expectedGrossSale - expectedSellFee;
      
      expect(result.grossProfit).toBeCloseTo(expectedGrossSale - 10000, 2);
      expect(result.netProfit).toBeCloseTo(expectedNetSale - 10000, 2);
      expect(result.isProfit).toBe(result.netProfit > 0);
    });

    it('should handle custom fees correctly', () => {
      const inputWithCustomFees: CalculatorInput = {
        ...baseInput,
        customBuyFee: 0.05, // Lower than default 0.10
        customSellFee: 0.15, // Lower than default 0.25
      };

      const result = calculateArbitrageProfit(inputWithCustomFees, mockOpportunity, 18.5);
      
      expect(result.buyFeePercentage).toBe(0.05);
      expect(result.sellFeePercentage).toBe(0.15);
      expect(result.buyFeeAmount).toBe(5); // 0.05% of $10,000
    });

    it('should include transfer fees in calculations', () => {
      const inputWithTransferFee: CalculatorInput = {
        ...baseInput,
        transferFee: 100, // $100 transfer fee
      };

      const result = calculateArbitrageProfit(inputWithTransferFee, mockOpportunity, 18.5);
      
      expect(result.transferFee).toBe(100);
      expect(result.totalFees).toBeGreaterThan(100); // Should include buy + sell + transfer fees
    });

    it('should throw error for unknown buy exchange', () => {
      const invalidOpportunity = {
        ...mockOpportunity,
        buyExchange: 'UnknownExchange'
      };

      expect(() => {
        calculateArbitrageProfit(baseInput, invalidOpportunity, 18.5);
      }).toThrow('Exchange fee data not found');
    });

    it('should throw error for unknown sell exchange', () => {
      const invalidOpportunity = {
        ...mockOpportunity,
        sellExchange: 'UnknownExchange'
      };

      expect(() => {
        calculateArbitrageProfit(baseInput, invalidOpportunity, 18.5);
      }).toThrow('Exchange fee data not found');
    });

    it('should handle zero investment amount', () => {
      const zeroInput: CalculatorInput = {
        amount: 0,
      };

      const result = calculateArbitrageProfit(zeroInput, mockOpportunity, 18.5);
      
      expect(result.investmentAmount).toBe(0);
      expect(result.buyFeeAmount).toBe(0);
      expect(result.grossProfit).toBeLessThanOrEqual(0);
      expect(result.netProfit).toBeLessThanOrEqual(0);
      expect(result.isProfit).toBe(false);
    });

    it('should calculate percentage return correctly', () => {
      const result = calculateArbitrageProfit(baseInput, mockOpportunity, 18.5);
      
      const expectedPercentage = (result.netProfit / result.investmentAmount) * 100;
      expect(result.netProfitPercentage).toBeCloseTo(expectedPercentage, 10);
    });

    it('should handle unprofitable opportunities correctly', () => {
      // Create a clearly unprofitable opportunity by making sell price much lower than buy price
      const unprofitableOpportunity: ArbitrageOpportunity = {
        ...mockOpportunity,
        buyPrice: 45000,
        sellPrice: 37000, // Sell price lower than buy price - clearly unprofitable
        spread: -8000
      };

      const result = calculateArbitrageProfit(baseInput, unprofitableOpportunity, 18.5);
      
      expect(result.isProfit).toBe(false);
      expect(result.netProfit).toBeLessThan(0);
      expect(result.netProfitPercentage).toBeLessThan(0);
      expect(result.buyPrice).toBe(45000);
      expect(result.sellPrice).toBe(37000);
    });

    it('should handle very small investment amounts', () => {
      const smallInput: CalculatorInput = {
        amount: 1, // $1 investment
      };

      const result = calculateArbitrageProfit(smallInput, mockOpportunity, 18.5);
      
      expect(result.investmentAmount).toBe(1);
      expect(result.buyFeeAmount).toBe(0.001); // 0.1% of $1
      expect(result.netProfit).toBeDefined();
      expect(result.isProfit).toBe(result.netProfit > 0);
    });

    it('should handle large investment amounts', () => {
      const largeInput: CalculatorInput = {
        amount: 1000000, // $1M investment
      };

      const result = calculateArbitrageProfit(largeInput, mockOpportunity, 18.5);
      
      expect(result.investmentAmount).toBe(1000000);
      expect(result.buyFeeAmount).toBe(1000); // 0.1% of $1M
      expect(result.totalFees).toBeGreaterThan(1000);
      expect(result.netProfit).toBeDefined();
    });

    it('should have consistent fee totals', () => {
      const result = calculateArbitrageProfit(baseInput, mockOpportunity, 18.5);
      
      const expectedTotalFees = result.buyFeeAmount + result.sellFeeAmount + (result.transferFee || 0);
      expect(result.totalFees).toBeCloseTo(expectedTotalFees, 10);
    });

    it('should maintain precision in calculations', () => {
      const preciseInput: CalculatorInput = {
        amount: 12345.67,
      };

      const result = calculateArbitrageProfit(preciseInput, mockOpportunity, 18.5);
      
      // Check that calculations maintain reasonable precision
      expect(result.buyFeeAmount).toBeCloseTo((12345.67 * 0.10) / 100, 10);
      expect(result.netProfit).toBeDefined();
      expect(Number.isFinite(result.netProfit)).toBe(true);
    });
  });
});