import { useState, useCallback } from 'react';
import { useDLMM } from './useDLMM';

export interface BacktestConfig {
  strategy: 'static_range' | 'dynamic_rebalance' | 'wide_range' | 'narrow_range';
  poolAddress: string;
  initialCapital: number;
  startDate: Date;
  endDate: Date;
  rangeWidth?: number; // For static strategies
  rebalanceThreshold?: number; // For dynamic strategies
  feePercentage?: number; // Estimated LP fees per day
}

export interface BacktestResult {
  strategy: string;
  period: {
    start: Date;
    end: Date;
  };
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
  avgPositionDuration: number;
  dailyReturns: Array<{
    date: Date;
    value: number;
    return: number;
  }>;
}

export const useBacktest = () => {
  const { pools } = useDLMM();
  const [backtesting, setBacktesting] = useState(false);
  const [results, setResults] = useState<BacktestResult[]>([]);

  // Simulate price movement for backtesting
  const generateHistoricalPrices = useCallback((
    startPrice: number,
    days: number,
    volatility: number = 0.02
  ) => {
    const prices = [startPrice];

    for (let i = 1; i < days; i++) {
      const randomReturn = (Math.random() - 0.5) * 2 * volatility;
      const drift = 0.0002; // Small upward drift
      const newPrice = prices[i - 1] * (1 + randomReturn + drift);
      prices.push(newPrice);
    }

    return prices;
  }, []);

  // Calculate impermanent loss
  const calculateImpermanentLoss = useCallback((
    entryPrice: number,
    currentPrice: number,
    entryTokenX: number,
    entryTokenY: number
  ) => {
    const priceRatio = currentPrice / entryPrice;
    const sqrtRatio = Math.sqrt(priceRatio);

    // Constant product formula for impermanent loss
    const impermanentLoss = 2 * sqrtRatio / (1 + priceRatio) - 1;

    const holdValue = (entryTokenX * currentPrice) + entryTokenY;
    const poolValue = holdValue * (1 + impermanentLoss);

    return poolValue - holdValue;
  }, []);

  // Run backtest for a specific strategy
  const runBacktest = useCallback(async (config: BacktestConfig): Promise<BacktestResult> => {
    setBacktesting(true);

    try {
      const pool = pools.find(p => p.address === config.poolAddress);
      if (!pool) {
        throw new Error('Pool not found');
      }

      const days = Math.ceil(
        (config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate historical price data
      const historicalPrices = generateHistoricalPrices(pool.currentPrice, days);

      let currentCapital = config.initialCapital;
      let tokenXAmount = config.initialCapital / 2 / pool.currentPrice;
      let tokenYAmount = config.initialCapital / 2;
      let totalTrades = 0;
      let winningTrades = 0;
      let maxDrawdown = 0;
      let peakValue = config.initialCapital;
      const dailyReturns: Array<{ date: Date; value: number; return: number }> = [];

      // Simulate each day
      for (let day = 0; day < days; day++) {
        const date = new Date(config.startDate.getTime() + day * 24 * 60 * 60 * 1000);
        const currentPrice = historicalPrices[day];
        const prevPrice = day > 0 ? historicalPrices[day - 1] : pool.currentPrice;

        // Calculate current portfolio value
        let portfolioValue = (tokenXAmount * currentPrice) + tokenYAmount;

        // Add estimated fees (simplified)
        const feePercentage = config.feePercentage || 0.0003; // 0.03% per day default
        const dailyFees = portfolioValue * feePercentage;
        portfolioValue += dailyFees;

        // Strategy-specific logic
        if (config.strategy === 'dynamic_rebalance') {
          const priceChange = Math.abs((currentPrice - prevPrice) / prevPrice);
          const threshold = config.rebalanceThreshold || 0.05; // 5% default

          if (priceChange > threshold) {
            // Rebalance: reset to 50/50 split
            const beforeValue = portfolioValue;
            tokenXAmount = portfolioValue / 2 / currentPrice;
            tokenYAmount = portfolioValue / 2;

            totalTrades++;
            if (portfolioValue > beforeValue) {
              winningTrades++;
            }
          }
        } else if (config.strategy === 'static_range') {
          const rangeWidth = config.rangeWidth || 0.1; // 10% default
          const lowerBound = pool.currentPrice * (1 - rangeWidth);
          const upperBound = pool.currentPrice * (1 + rangeWidth);

          // Check if price is out of range
          if (currentPrice < lowerBound || currentPrice > upperBound) {
            // Position out of range - no fees earned, only IL
            portfolioValue -= dailyFees; // Remove fees for this day
          }
        } else if (config.strategy === 'wide_range') {
          // Wide range (20%) - less IL, less fees
          const dailyFeesAdjusted = dailyFees * 0.5; // 50% of normal fees
          portfolioValue = portfolioValue - dailyFees + dailyFeesAdjusted;
        } else if (config.strategy === 'narrow_range') {
          // Narrow range (5%) - more IL risk, more fees when in range
          const rangeWidth = 0.05;
          const lowerBound = pool.currentPrice * (1 - rangeWidth);
          const upperBound = pool.currentPrice * (1 + rangeWidth);

          if (currentPrice >= lowerBound && currentPrice <= upperBound) {
            portfolioValue += dailyFees; // Double fees when in range
          } else {
            portfolioValue -= dailyFees * 2; // Penalty for being out of range
          }
        }

        // Calculate impermanent loss
        const il = calculateImpermanentLoss(
          pool.currentPrice,
          currentPrice,
          config.initialCapital / 2 / pool.currentPrice,
          config.initialCapital / 2
        );
        portfolioValue += il;

        // Track max drawdown
        if (portfolioValue > peakValue) {
          peakValue = portfolioValue;
        }
        const drawdown = (peakValue - portfolioValue) / peakValue;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }

        // Record daily return
        const dailyReturn = day > 0
          ? (portfolioValue - dailyReturns[day - 1].value) / dailyReturns[day - 1].value
          : 0;

        dailyReturns.push({
          date,
          value: portfolioValue,
          return: dailyReturn,
        });

        currentCapital = portfolioValue;
      }

      // Calculate final metrics
      const finalValue = currentCapital;
      const totalReturn = ((finalValue - config.initialCapital) / config.initialCapital) * 100;
      const annualizedReturn = (totalReturn / days) * 365;

      // Calculate Sharpe ratio (simplified)
      const returns = dailyReturns.map(d => d.return);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const stdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const avgPositionDuration = days / Math.max(totalTrades, 1);

      const result: BacktestResult = {
        strategy: config.strategy,
        period: {
          start: config.startDate,
          end: config.endDate,
        },
        initialCapital: config.initialCapital,
        finalValue,
        totalReturn,
        annualizedReturn,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio,
        totalTrades,
        winRate,
        avgPositionDuration,
        dailyReturns,
      };

      // Add to results
      setResults(prev => [...prev, result]);

      return result;
    } finally {
      setBacktesting(false);
    }
  }, [pools, generateHistoricalPrices, calculateImpermanentLoss]);

  // Run multiple strategies and compare
  const compareStrategies = useCallback(async (
    poolAddress: string,
    initialCapital: number,
    startDate: Date,
    endDate: Date
  ) => {
    const strategies: BacktestConfig['strategy'][] = [
      'static_range',
      'dynamic_rebalance',
      'wide_range',
      'narrow_range',
    ];

    const results: BacktestResult[] = [];

    for (const strategy of strategies) {
      const config: BacktestConfig = {
        strategy,
        poolAddress,
        initialCapital,
        startDate,
        endDate,
        rangeWidth: strategy === 'wide_range' ? 0.2 : strategy === 'narrow_range' ? 0.05 : 0.1,
        rebalanceThreshold: 0.05,
        feePercentage: 0.0003,
      };

      const result = await runBacktest(config);
      results.push(result);
    }

    return results;
  }, [runBacktest]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    backtesting,
    results,
    runBacktest,
    compareStrategies,
    clearResults,
  };
};
