'use client';

import React, { useState } from 'react';
import { Plus, Zap, TrendingUp, Settings } from 'lucide-react';
import { DLMMPool } from '@/hooks/useDLMM';

interface QuickActionsProps {
  pools: DLMMPool[];
  onCreatePosition: (poolAddress: string, lowerPrice: number, upperPrice: number, tokenXAmount: number, tokenYAmount: number) => Promise<any>;
}

export function QuickActions({ pools, onCreatePosition }: QuickActionsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [lowerPrice, setLowerPrice] = useState<string>('');
  const [upperPrice, setUpperPrice] = useState<string>('');
  const [tokenXAmount, setTokenXAmount] = useState<string>('');
  const [tokenYAmount, setTokenYAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !lowerPrice || !upperPrice || !tokenXAmount || !tokenYAmount) return;

    setLoading(true);
    try {
      await onCreatePosition(
        selectedPool,
        parseFloat(lowerPrice),
        parseFloat(upperPrice),
        parseFloat(tokenXAmount),
        parseFloat(tokenYAmount)
      );
      setShowCreateForm(false);
      // Reset form
      setSelectedPool('');
      setLowerPrice('');
      setUpperPrice('');
      setTokenXAmount('');
      setTokenYAmount('');
    } catch (error) {
      console.error('Failed to create position:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPoolData = pools.find(p => p.address === selectedPool);

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium">Add Liquidity</span>
          <span className="text-xs opacity-90">Create new position</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105">
          <Zap className="w-8 h-8 mb-2" />
          <span className="font-medium">Auto Rebalance</span>
          <span className="text-xs opacity-90">Set up automation</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105">
          <TrendingUp className="w-8 h-8 mb-2" />
          <span className="font-medium">Analytics</span>
          <span className="text-xs opacity-90">View performance</span>
        </button>

        <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all transform hover:scale-105">
          <Settings className="w-8 h-8 mb-2" />
          <span className="font-medium">Settings</span>
          <span className="text-xs opacity-90">Manage preferences</span>
        </button>
      </div>

      {/* Create Position Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Position</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePosition} className="space-y-4">
              {/* Pool Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Pool
                </label>
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a pool...</option>
                  {pools.map((pool) => (
                    <option key={pool.address} value={pool.address}>
                      {pool.tokenX.symbol}/{pool.tokenY.symbol} - {pool.currentPrice.toFixed(4)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPoolData && (
                <>
                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lower Price
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={lowerPrice}
                        onChange={(e) => setLowerPrice(e.target.value)}
                        placeholder={`< ${selectedPoolData.currentPrice.toFixed(4)}`}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upper Price
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={upperPrice}
                        onChange={(e) => setUpperPrice(e.target.value)}
                        placeholder={`> ${selectedPoolData.currentPrice.toFixed(4)}`}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Token Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {selectedPoolData.tokenX.symbol} Amount
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={tokenXAmount}
                        onChange={(e) => setTokenXAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {selectedPoolData.tokenY.symbol} Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tokenYAmount}
                        onChange={(e) => setTokenYAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Current Price Info */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                    <p className="text-sm text-indigo-900 dark:text-indigo-200">
                      Current Price: <span className="font-semibold">{selectedPoolData.currentPrice.toFixed(4)}</span>
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                      Make sure your price range includes the current price for immediate fee earning
                    </p>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedPool}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                >
                  {loading ? 'Creating...' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}