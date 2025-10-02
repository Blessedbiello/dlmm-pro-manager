'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Settings,
  Trash2,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatPercentage, calculatePositionValue, truncateAddress } from '@/lib/utils';
import { DLMMPosition, DLMMPool } from '@/hooks/useDLMM';
import { useAutoRebalance } from '@/contexts/AutoRebalanceContext';

interface PositionsListProps {
  positions: DLMMPosition[];
  pools: DLMMPool[];
  onRemoveLiquidity: (positionId: string, amount: number) => Promise<any>;
  onCollectFees: (positionId: string) => Promise<any>;
}

export function PositionsList({
  positions,
  pools,
  onRemoveLiquidity,
  onCollectFees
}: PositionsListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const { configs, isRebalancing } = useAutoRebalance();

  const handleCollectFees = async (positionId: string) => {
    setLoading(positionId);
    try {
      await onCollectFees(positionId);
    } catch (error) {
      console.error('Failed to collect fees:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveLiquidity = async (positionId: string, percentage: number = 100) => {
    setLoading(positionId);
    try {
      await onRemoveLiquidity(positionId, percentage);
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
    } finally {
      setLoading(null);
    }
  };

  const getPositionStatus = (position: DLMMPosition, pool?: DLMMPool) => {
    if (!pool) return { status: 'unknown', color: 'gray' };

    const { currentPrice } = pool;
    if (currentPrice >= position.lowerPrice && currentPrice <= position.upperPrice) {
      return { status: 'In Range', color: 'green' };
    } else {
      return { status: 'Out of Range', color: 'red' };
    }
  };

  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Positions</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have any DLMM positions yet. Create your first position to start earning fees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Positions</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {positions.length} position{positions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-4">
        {positions.map((position) => {
          const pool = pools.find(p => p.address === position.poolAddress);
          const positionValue = pool ? calculatePositionValue(
            position.tokenXAmount,
            position.tokenYAmount,
            pool.currentPrice,
            1
          ) : 0;
          const { status, color } = getPositionStatus(position, pool);
          const autoRebalanceConfig = configs[position.id];
          const isAutoRebalancing = isRebalancing(position.id);

          return (
            <div
              key={position.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all"
            >
              {/* Position Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {pool && (
                      <>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {pool.tokenX.symbol}/{pool.tokenY.symbol}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          color === 'green'
                            ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400'
                        }`}>
                          {status}
                        </span>
                        {autoRebalanceConfig?.enabled && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 flex items-center space-x-1">
                            <RefreshCw className={`w-3 h-3 ${isAutoRebalancing ? 'animate-spin' : ''}`} />
                            <span>{isAutoRebalancing ? 'Rebalancing...' : 'Auto-Rebalance'}</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCollectFees(position.id)}
                    disabled={loading === position.id || position.feesEarned === 0}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Collect Fees"
                  >
                    {loading === position.id ? (
                      <div className="w-4 h-4 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedPosition(selectedPosition === position.id ? null : position.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Position Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveLiquidity(position.id, 100)}
                    disabled={loading === position.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Liquidity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Position Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Position Value</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(positionValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">P&L</p>
                  <div className="flex items-center space-x-1">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                    )}
                    <p className={`text-lg font-semibold ${
                      position.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(position.pnl)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fees Earned</p>
                  <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(position.feesEarned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">APY</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatPercentage(position.apy)}
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Range</span>
                  {pool && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {formatCurrency(pool.currentPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lower</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(position.lowerPrice)}</p>
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                    {pool && (
                      <div
                        className="absolute top-0 h-full bg-blue-500 rounded-full"
                        style={{
                          left: `${Math.max(0, ((position.lowerPrice - (position.lowerPrice * 0.1)) / (position.upperPrice + (position.upperPrice * 0.1) - (position.lowerPrice * 0.9))) * 100)}%`,
                          width: `${Math.min(100, ((position.upperPrice - position.lowerPrice) / (position.upperPrice + (position.upperPrice * 0.1) - (position.lowerPrice * 0.9))) * 100)}%`
                        }}
                      />
                    )}
                    {pool && (
                      <div
                        className="absolute top-0 w-1 h-full bg-yellow-500 rounded-full"
                        style={{
                          left: `${((pool.currentPrice - (position.lowerPrice * 0.9)) / (position.upperPrice + (position.upperPrice * 0.1) - (position.lowerPrice * 0.9))) * 100}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Upper</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(position.upperPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Token Amounts */}
              <div className="grid grid-cols-2 gap-4">
                {pool && (
                  <>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pool.tokenX.symbol}</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {position.tokenXAmount.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pool.tokenY.symbol}</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        {position.tokenYAmount.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Expanded Details Modal */}
              {selectedPosition === position.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Position Details</h4>
                      <button
                        onClick={() => setSelectedPosition(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Position Address</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {truncateAddress(position.id)}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pool Address</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {truncateAddress(position.poolAddress)}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lower Bin ID</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {position.lowerBinId}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Upper Bin ID</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {position.upperBinId}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Liquidity</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {position.liquidity.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Position Mint</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {truncateAddress(position.positionMint)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <a
                        href={`https://explorer.solana.com/address/${position.id}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on Explorer</span>
                      </a>
                      <button
                        onClick={() => handleRemoveLiquidity(position.id, 50)}
                        disabled={loading === position.id}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        Remove 50%
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}