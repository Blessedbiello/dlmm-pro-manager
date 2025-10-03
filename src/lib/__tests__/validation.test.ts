import { describe, it, expect } from 'vitest';
import {
  validatePriceRange,
  validateTokenAmounts,
  validateSlippage,
  calculateSlippage,
  validateBalance,
  validateOrderParams,
  estimateGasCost,
  isTransactionEconomical,
} from '../validation';

describe('Validation Utils', () => {
  describe('validatePriceRange', () => {
    it('should validate correct price range', () => {
      const result = validatePriceRange(100, 150, 120);
      expect(result.valid).toBe(true);
    });

    it('should reject when lower price is greater than upper price', () => {
      const result = validatePriceRange(150, 100, 120);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Lower price must be less than upper price');
    });

    it('should reject when lower price is zero or negative', () => {
      const result = validatePriceRange(0, 150, 120);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be greater than 0');
    });

    it('should reject when current price is outside range', () => {
      const result = validatePriceRange(100, 110, 120);
      expect(result.valid).toBe(false);
    });

    it('should reject when range is too narrow', () => {
      const result = validatePriceRange(100, 100.5, 100.25);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too narrow');
    });

    it('should reject when range is too wide', () => {
      const result = validatePriceRange(100, 500, 200);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too wide');
    });
  });

  describe('validateTokenAmounts', () => {
    it('should validate correct token amounts', () => {
      const result = validateTokenAmounts(10, 20);
      expect(result.valid).toBe(true);
    });

    it('should reject negative amounts', () => {
      const result = validateTokenAmounts(-10, 20);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    it('should reject when both amounts are below minimum', () => {
      const result = validateTokenAmounts(0.0001, 0.0001, 0.001);
      expect(result.valid).toBe(false);
    });

    it('should accept when at least one amount meets minimum', () => {
      const result = validateTokenAmounts(0.01, 0, 0.001);
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateSlippage', () => {
    it('should calculate slippage correctly', () => {
      const slippage = calculateSlippage(100, 102);
      expect(slippage).toBe(2);
    });

    it('should handle negative price movement', () => {
      const slippage = calculateSlippage(100, 98);
      expect(slippage).toBe(2);
    });
  });

  describe('validateSlippage', () => {
    it('should accept slippage within tolerance', () => {
      const result = validateSlippage(100, 101, 2);
      expect(result.valid).toBe(true);
    });

    it('should reject slippage exceeding tolerance', () => {
      const result = validateSlippage(100, 105, 2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum tolerance');
    });
  });

  describe('validateBalance', () => {
    it('should validate sufficient balance', () => {
      const result = validateBalance(10, 20, 'SOL');
      expect(result.valid).toBe(true);
    });

    it('should reject insufficient balance', () => {
      const result = validateBalance(20, 10, 'USDC');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
    });

    it('should reserve SOL for transaction fees', () => {
      const result = validateBalance(0.99, 1, 'SOL');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('transaction fees');
    });
  });

  describe('validateOrderParams', () => {
    it('should validate limit order correctly', () => {
      const result = validateOrderParams('limit', 105, 100);
      expect(result.valid).toBe(true);
    });

    it('should reject stop-loss above current price', () => {
      const result = validateOrderParams('stop_loss', 105, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('below current price');
    });

    it('should reject take-profit below current price', () => {
      const result = validateOrderParams('take_profit', 95, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('above current price');
    });

    it('should reject limit order too close to current price', () => {
      const result = validateOrderParams('limit', 100.05, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 0.1% different');
    });
  });

  describe('estimateGasCost', () => {
    it('should estimate create position cost', () => {
      const cost = estimateGasCost('create_position');
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001);
    });

    it('should estimate rebalance cost higher than simple operations', () => {
      const rebalanceCost = estimateGasCost('rebalance');
      const removeCost = estimateGasCost('remove_liquidity');
      expect(rebalanceCost).toBeGreaterThan(removeCost);
    });
  });

  describe('isTransactionEconomical', () => {
    it('should accept economical transactions', () => {
      const result = isTransactionEconomical(0.1, 0.01, 2);
      expect(result.valid).toBe(true);
    });

    it('should reject uneconomical transactions', () => {
      const result = isTransactionEconomical(0.01, 0.01, 2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not economical');
    });
  });
});
