'use client';

import React from 'react';
import { TrendingUp, Activity, Zap, Plus } from 'lucide-react';
import { formatCurrency, formatLargeNumber, formatPercentage } from '@/lib/utils';
import { DLMMPool } from '@/hooks/useDLMM';

interface PoolsListProps {
  pools: DLMMPool[];
}

export function PoolsList({ pools }: PoolsListProps) {
  const isMockData = pools.length === 1 && pools[0].address === "Sample Pool 1";
  const networkEnv = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta').toUpperCase();

  if (pools.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Available Pools</h3>
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      {isMockData && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/50 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Demo Mode - Mock Data Displayed
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                Public RPC blocks pool data queries with 403 errors. You need a private RPC endpoint to fetch real Saros DLMM pools.
              </p>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Quick fix:</strong> Get a free RPC from <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900 dark:hover:text-yellow-100">Helius</a> or <a href="https://quicknode.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900 dark:hover:text-yellow-100">QuickNode</a>
                <br />
                Then set <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded">NEXT_PUBLIC_RPC_ENDPOINT</code> in .env.local
                <br />
                See <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded">RPC_SETUP.md</code> for detailed instructions.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Available Pools</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">{pools.length} {isMockData ? 'sample ' : ''}pool{pools.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {pools.map((pool) => (
          <div
            key={pool.address}
            className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-slate-800/50 transition-shadow cursor-pointer"
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
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pool.tokenX.symbol}/{pool.tokenY.symbol}
                </span>
              </div>
              <button className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(pool.currentPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">TVL</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatLargeNumber(pool.tvl)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">24h Volume</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatLargeNumber(pool.volume24h)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">24h Fees</p>
                <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatLargeNumber(pool.fees24h)}
                </p>
              </div>
            </div>

            {/* APR Badge */}
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">APR</span>
              </div>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                ~{formatPercentage(pool.fees24h / pool.tvl * 365 * 100)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Liquidity CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Ready to provide liquidity?</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Earn fees by providing liquidity to DLMM pools
          </p>
          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30">
            Create New Position
          </button>
        </div>
      </div>
    </div>
  );
}