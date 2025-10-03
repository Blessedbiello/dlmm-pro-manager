import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDLMM } from './useDLMM';

export interface Order {
  id: string;
  type: 'limit' | 'stop_loss' | 'take_profit' | 'dca';
  poolAddress: string;
  positionId?: string; // For stop-loss/take-profit on existing positions
  targetPrice: number;
  tokenXAmount?: number;
  tokenYAmount?: number;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  createdAt: number;
  executedAt?: number;
  expiresAt?: number;
  transactionId?: string;
}

export const useOrderTypes = () => {
  const { publicKey } = useWallet();
  const { pools, positions, createPosition, removeLiquidity } = useDLMM();

  const [orders, setOrders] = useState<Order[]>([]);
  const [monitoring, setMonitoring] = useState(false);

  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      try {
        const stored = localStorage.getItem('dlmm_orders');
        if (stored) {
          const parsedOrders = JSON.parse(stored);
          // Filter out expired orders
          const validOrders = parsedOrders.filter((order: Order) => {
            if (order.expiresAt && order.expiresAt < Date.now()) {
              return false;
            }
            return order.status === 'pending';
          });
          setOrders(validOrders);
        }
      } catch (err) {
        console.warn('Failed to load orders:', err);
      }
    };

    loadOrders();
  }, []);

  // Save orders to localStorage
  const saveOrders = useCallback((updatedOrders: Order[]) => {
    try {
      localStorage.setItem('dlmm_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    } catch (err) {
      console.warn('Failed to save orders:', err);
    }
  }, []);

  // Create a limit order
  const createLimitOrder = useCallback(async (
    poolAddress: string,
    targetPrice: number,
    tokenXAmount: number,
    tokenYAmount: number,
    expiresInHours?: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const order: Order = {
      id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'limit',
      poolAddress,
      targetPrice,
      tokenXAmount,
      tokenYAmount,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: expiresInHours ? Date.now() + (expiresInHours * 60 * 60 * 1000) : undefined,
    };

    const updatedOrders = [...orders, order];
    saveOrders(updatedOrders);

    return order;
  }, [publicKey, orders, saveOrders]);

  // Create a stop-loss order
  const createStopLoss = useCallback(async (
    positionId: string,
    stopPrice: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    const order: Order = {
      id: `stop_loss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'stop_loss',
      poolAddress: position.poolAddress,
      positionId,
      targetPrice: stopPrice,
      status: 'pending',
      createdAt: Date.now(),
    };

    const updatedOrders = [...orders, order];
    saveOrders(updatedOrders);

    return order;
  }, [publicKey, positions, orders, saveOrders]);

  // Create a take-profit order
  const createTakeProfit = useCallback(async (
    positionId: string,
    takeProfitPrice: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    const order: Order = {
      id: `take_profit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'take_profit',
      poolAddress: position.poolAddress,
      positionId,
      targetPrice: takeProfitPrice,
      status: 'pending',
      createdAt: Date.now(),
    };

    const updatedOrders = [...orders, order];
    saveOrders(updatedOrders);

    return order;
  }, [publicKey, positions, orders, saveOrders]);

  // Create a DCA order
  const createDCAOrder = useCallback(async (
    poolAddress: string,
    tokenXAmount: number,
    tokenYAmount: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    const order: Order = {
      id: `dca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'dca',
      poolAddress,
      targetPrice: 0, // DCA doesn't use target price
      tokenXAmount,
      tokenYAmount,
      status: 'pending',
      createdAt: Date.now(),
      // Store DCA-specific data
    };

    const updatedOrders = [...orders, order];
    saveOrders(updatedOrders);

    return order;
  }, [publicKey, orders, saveOrders]);

  // Cancel an order
  const cancelOrder = useCallback(async (orderId: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'cancelled' as const }
        : order
    );
    saveOrders(updatedOrders);
  }, [orders, saveOrders]);

  // Execute limit order when price is reached
  const executeLimitOrder = useCallback(async (order: Order, currentPrice: number) => {
    try {
      console.log(`Executing limit order ${order.id} at price ${currentPrice}`);

      // Calculate price range around target price (e.g., ±1%)
      const rangePercent = 0.01; // 1%
      const lowerPrice = order.targetPrice * (1 - rangePercent);
      const upperPrice = order.targetPrice * (1 + rangePercent);

      const result = await createPosition(
        order.poolAddress,
        lowerPrice,
        upperPrice,
        order.tokenXAmount || 0,
        order.tokenYAmount || 0
      );

      const updatedOrders = orders.map(o =>
        o.id === order.id
          ? {
              ...o,
              status: 'executed' as const,
              executedAt: Date.now(),
              transactionId: result.transactionId,
            }
          : o
      );
      saveOrders(updatedOrders);

      return result;
    } catch (err) {
      console.error('Failed to execute limit order:', err);
      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, status: 'failed' as const } : o
      );
      saveOrders(updatedOrders);
      throw err;
    }
  }, [orders, saveOrders, createPosition]);

  // Execute stop-loss order when price drops below threshold
  const executeStopLoss = useCallback(async (order: Order) => {
    try {
      if (!order.positionId) {
        throw new Error('Position ID required for stop-loss');
      }

      console.log(`Executing stop-loss order ${order.id} for position ${order.positionId}`);

      const position = positions.find(p => p.id === order.positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Remove all liquidity from the position
      const result = await removeLiquidity(order.positionId);

      const updatedOrders = orders.map(o =>
        o.id === order.id
          ? {
              ...o,
              status: 'executed' as const,
              executedAt: Date.now(),
              transactionId: result.transactionId,
            }
          : o
      );
      saveOrders(updatedOrders);

      return result;
    } catch (err) {
      console.error('Failed to execute stop-loss:', err);
      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, status: 'failed' as const } : o
      );
      saveOrders(updatedOrders);
      throw err;
    }
  }, [orders, saveOrders, positions, removeLiquidity]);

  // Execute take-profit order when price reaches target
  const executeTakeProfit = useCallback(async (order: Order) => {
    try {
      if (!order.positionId) {
        throw new Error('Position ID required for take-profit');
      }

      console.log(`Executing take-profit order ${order.id} for position ${order.positionId}`);

      const position = positions.find(p => p.id === order.positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Remove all liquidity from the position
      const result = await removeLiquidity(order.positionId);

      const updatedOrders = orders.map(o =>
        o.id === order.id
          ? {
              ...o,
              status: 'executed' as const,
              executedAt: Date.now(),
              transactionId: result.transactionId,
            }
          : o
      );
      saveOrders(updatedOrders);

      return result;
    } catch (err) {
      console.error('Failed to execute take-profit:', err);
      const updatedOrders = orders.map(o =>
        o.id === order.id ? { ...o, status: 'failed' as const } : o
      );
      saveOrders(updatedOrders);
      throw err;
    }
  }, [orders, saveOrders, positions, removeLiquidity]);

  // Monitor orders and execute when conditions are met
  const monitorOrders = useCallback(async () => {
    if (!publicKey || orders.length === 0) return;

    for (const order of orders) {
      if (order.status !== 'pending') continue;

      // Check if order expired
      if (order.expiresAt && order.expiresAt < Date.now()) {
        const updatedOrders = orders.map(o =>
          o.id === order.id ? { ...o, status: 'cancelled' as const } : o
        );
        saveOrders(updatedOrders);
        continue;
      }

      const pool = pools.find(p => p.address === order.poolAddress);
      if (!pool) continue;

      const currentPrice = pool.currentPrice;

      try {
        // Execute limit orders when price reaches target
        if (order.type === 'limit') {
          const priceReached = Math.abs(currentPrice - order.targetPrice) / order.targetPrice < 0.005; // Within 0.5%
          if (priceReached) {
            await executeLimitOrder(order, currentPrice);
          }
        }

        // Execute stop-loss when price drops below threshold
        if (order.type === 'stop_loss') {
          if (currentPrice <= order.targetPrice) {
            await executeStopLoss(order);
          }
        }

        // Execute take-profit when price rises above threshold
        if (order.type === 'take_profit') {
          if (currentPrice >= order.targetPrice) {
            await executeTakeProfit(order);
          }
        }
      } catch (err) {
        console.error(`Error executing order ${order.id}:`, err);
      }
    }
  }, [publicKey, orders, pools, saveOrders, executeLimitOrder, executeStopLoss, executeTakeProfit]);

  // Start monitoring
  useEffect(() => {
    if (!monitoring) return;

    const interval = setInterval(() => {
      monitorOrders();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [monitoring, monitorOrders]);

  // Auto-start monitoring when there are pending orders
  useEffect(() => {
    const hasPendingOrders = orders.some(o => o.status === 'pending');
    if (hasPendingOrders && !monitoring) {
      setMonitoring(true);
    } else if (!hasPendingOrders && monitoring) {
      setMonitoring(false);
    }
  }, [orders, monitoring]);

  return {
    orders,
    monitoring,
    createLimitOrder,
    createStopLoss,
    createTakeProfit,
    createDCAOrder,
    cancelOrder,
    startMonitoring: () => setMonitoring(true),
    stopMonitoring: () => setMonitoring(false),
  };
};
