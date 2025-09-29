'use client';

import React from 'react';
import { TrendingUp, Activity, Zap, Plus } from 'lucide-react';
import { formatCurrency, formatLargeNumber, formatPercentage } from '@/lib/utils';
import { DLMMPool } from '@/hooks/useDLMM';

interface PoolsListProps {
  pools: DLMMPool[];
}

export function PoolsList({ pools }: PoolsListProps) {
  if (pools.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Pools</h3>
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No pools available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Available Pools</h3>
        <span className="text-sm text-gray-600">{pools.length} pools</span>
      </div>

      <div className="space-y-4">
        {pools.map((pool) => (
          <div
            key={pool.address}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Pool Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {pool.tokenX.symbol.charAt(0)}
                  </div>
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {pool.tokenY.symbol.charAt(0)}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {pool.tokenX.symbol}/{pool.tokenY.symbol}
                </span>
              </div>
              <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-600">Price</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(pool.currentPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">TVL</p>
                <p className="font-semibold text-gray-900">
                  {formatLargeNumber(pool.tvl)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">24h Volume</p>
                <p className="font-semibold text-green-600">
                  {formatLargeNumber(pool.volume24h)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">24h Fees</p>
                <p className="font-semibold text-yellow-600">
                  {formatLargeNumber(pool.fees24h)}
                </p>
              </div>
            </div>

            {/* APR Badge */}
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600">APR</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                ~{formatPercentage(pool.fees24h / pool.tvl * 365 * 100)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Liquidity CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">Ready to provide liquidity?</p>
          <p className="text-xs text-gray-600 mb-3">
            Earn fees by providing liquidity to DLMM pools
          </p>
          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
            Create New Position
          </button>
        </div>
      </div>
    </div>
  );
}