'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDLMM } from '@/hooks/useDLMM';
import { useAutoRebalanceMonitor } from '@/hooks/useAutoRebalanceMonitor';
import { PortfolioOverview } from './PortfolioOverview';
import { PositionsList } from './PositionsList';
import { PoolsList } from './PoolsList';
import { QuickActions } from './QuickActions';
import { PerformanceChart } from './PerformanceChart';
import { AlertsPanel } from './AlertsPanel';

export function Dashboard() {
  const { connected } = useWallet();
  const {
    pools,
    positions,
    loading,
    error,
    createPosition,
    removeLiquidity,
    collectFees,
    rebalancePosition
  } = useDLMM();

  // Enable auto-rebalance monitoring
  useAutoRebalanceMonitor({
    positions,
    pools,
    rebalancePosition
  });

  if (!connected) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mx-auto w-28 h-28 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm border border-indigo-500/20 dark:border-indigo-500/10">
            <svg className="w-14 h-14 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto text-lg">
            Connect your Solana wallet to unlock professional DLMM position management, real-time analytics, and automated trading strategies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Position Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage your DLMM positions in real-time with live P&L</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Automated Rebalancing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set up automated strategies for optimal returns and risk management</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-pink-500 dark:hover:border-pink-500 transition-all hover:shadow-lg hover:shadow-pink-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Advanced Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive performance tracking and insights with backtesting</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-indigo-600 dark:border-indigo-400 mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your DLMM data...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Fetching pools and positions from Saros Finance</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Portfolio Overview */}
        <PortfolioOverview positions={positions} pools={pools} />

        {/* Quick Actions */}
        <QuickActions
          pools={pools}
          positions={positions}
          onCreatePosition={createPosition}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Positions and Performance */}
          <div className="lg:col-span-2 space-y-8">
            <PerformanceChart positions={positions} />
            <PositionsList
              positions={positions}
              pools={pools}
              onRemoveLiquidity={removeLiquidity}
              onCollectFees={collectFees}
            />
          </div>

          {/* Right Column - Pools and Alerts */}
          <div className="space-y-8">
            <PoolsList pools={pools} />
            <AlertsPanel positions={positions} />
          </div>
        </div>
      </div>
    </div>
  );
}