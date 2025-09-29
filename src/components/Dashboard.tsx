'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDLMM } from '@/hooks/useDLMM';
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
    collectFees
  } = useDLMM();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Connect your Solana wallet to start managing your DLMM positions, view analytics, and access automated trading features.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Position Management</h3>
                <p className="text-sm text-gray-600">Track and manage your DLMM positions in real-time</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Automated Rebalancing</h3>
                <p className="text-sm text-gray-600">Set up automated strategies for optimal returns</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">Comprehensive performance tracking and insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your DLMM data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
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