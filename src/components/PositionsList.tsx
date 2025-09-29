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
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatPercentage, calculatePositionValue, truncateAddress } from '@/lib/utils';
import { DLMMPosition, DLMMPool } from '@/hooks/useDLMM';

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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Positions</h3>
        <p className="text-gray-600 mb-6">
          You don't have any DLMM positions yet. Create your first position to start earning fees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Active Positions</h3>
        <div className="text-sm text-gray-600">
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

          return (
            <div
              key={position.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              {/* Position Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {pool && (
                      <>
                        <span className="font-medium text-gray-900">
                          {pool.tokenX.symbol}/{pool.tokenY.symbol}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          color === 'green'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCollectFees(position.id)}
                    disabled={loading === position.id || position.feesEarned === 0}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Collect Fees"
                  >
                    {loading === position.id ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedPosition(position.id)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Position Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveLiquidity(position.id, 100)}
                    disabled={loading === position.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Liquidity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Position Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Position Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(positionValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">P&L</p>
                  <div className="flex items-center space-x-1">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <p className={`text-lg font-semibold ${
                      position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(position.pnl)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fees Earned</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(position.feesEarned)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">APY</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatPercentage(position.apy)}
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Price Range</span>
                  {pool && (
                    <span className="text-sm text-gray-600">
                      Current: {formatCurrency(pool.currentPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Lower</p>
                    <p className="font-medium">{formatCurrency(position.lowerPrice)}</p>
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
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
                    <p className="text-xs text-gray-600">Upper</p>
                    <p className="font-medium">{formatCurrency(position.upperPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Token Amounts */}
              <div className="grid grid-cols-2 gap-4">
                {pool && (
                  <>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">{pool.tokenX.symbol}</p>
                      <p className="font-semibold text-blue-600">
                        {position.tokenXAmount.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">{pool.tokenY.symbol}</p>
                      <p className="font-semibold text-purple-600">
                        {position.tokenYAmount.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}