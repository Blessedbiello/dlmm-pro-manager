import { useEffect, useCallback } from 'react';
import { useAutoRebalance } from '@/contexts/AutoRebalanceContext';
import { DLMMPosition, DLMMPool } from './useDLMM';

interface MonitorProps {
  positions: DLMMPosition[];
  pools: DLMMPool[];
  rebalancePosition: (positionId: string, newRangeWidth: number) => Promise<any>;
}

export function useAutoRebalanceMonitor({ positions, pools, rebalancePosition }: MonitorProps) {
  const {
    configs,
    addRebalanceEvent,
    isRebalancing,
    setRebalancing
  } = useAutoRebalance();

  const checkAndRebalance = useCallback(async () => {
    const now = Date.now();

    for (const position of positions) {
      const config = configs[position.id];

      // Skip if auto-rebalance is not enabled or already rebalancing
      if (!config || !config.enabled || isRebalancing(position.id)) {
        continue;
      }

      // Check minimum time between rebalances
      if (config.lastRebalanceTime) {
        const timeSinceLastRebalance = (now - config.lastRebalanceTime) / (1000 * 60); // minutes
        if (timeSinceLastRebalance < config.minTimeBetweenRebalances) {
          continue;
        }
      }

      const pool = pools.find(p => p.address === position.poolAddress);
      if (!pool) continue;

      const { currentPrice } = pool;

      // Check if position is out of range
      const isOutOfRange = currentPrice < position.lowerPrice || currentPrice > position.upperPrice;

      if (!isOutOfRange) {
        continue;
      }

      // Calculate price deviation from range center
      const rangeCenter = (position.lowerPrice + position.upperPrice) / 2;
      const priceDeviation = Math.abs((currentPrice - rangeCenter) / rangeCenter) * 100;

      // Check if deviation exceeds threshold
      if (priceDeviation < config.priceDeviationThreshold) {
        continue;
      }

      // Trigger rebalance
      console.log(`Auto-rebalancing position ${position.id} - price deviation: ${priceDeviation.toFixed(2)}%`);

      setRebalancing(position.id, true);

      try {
        const result = await rebalancePosition(position.id, config.newRangeWidth);

        // Record successful rebalance
        addRebalanceEvent({
          id: `rebalance_${position.id}_${now}`,
          positionId: position.id,
          timestamp: now,
          oldRange: result.oldRange,
          newRange: result.newRange,
          txHash: result.transactionId,
          success: true
        });

        console.log(`Successfully rebalanced position ${position.id}`);
      } catch (error) {
        console.error(`Failed to rebalance position ${position.id}:`, error);

        // Record failed rebalance
        addRebalanceEvent({
          id: `rebalance_${position.id}_${now}`,
          positionId: position.id,
          timestamp: now,
          oldRange: { lower: position.lowerPrice, upper: position.upperPrice },
          newRange: { lower: 0, upper: 0 },
          txHash: '',
          success: false
        });
      } finally {
        setRebalancing(position.id, false);
      }
    }
  }, [positions, pools, configs, rebalancePosition, addRebalanceEvent, isRebalancing, setRebalancing]);

  // Monitor positions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndRebalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [checkAndRebalance]);

  // Also check immediately when positions or configs change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndRebalance();
    }, 1000); // Small delay to avoid too frequent checks

    return () => clearTimeout(timer);
  }, [positions, configs, checkAndRebalance]);

  return {
    checkAndRebalance
  };
}
