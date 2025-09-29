'use client';

import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import { formatCurrency, formatPercentage, calculatePositionValue } from '@/lib/utils';
import { DLMMPosition, DLMMPool } from '@/hooks/useDLMM';

interface PortfolioOverviewProps {
  positions: DLMMPosition[];
  pools: DLMMPool[];
}

export function PortfolioOverview({ positions, pools }: PortfolioOverviewProps) {
  // Calculate portfolio metrics
  const totalValue = positions.reduce((sum, position) => {
    const pool = pools.find(p => p.address === position.poolAddress);
    if (!pool) return sum;
    return sum + calculatePositionValue(
      position.tokenXAmount,
      position.tokenYAmount,
      pool.currentPrice,
      1
    );
  }, 0);

  const totalPnL = positions.reduce((sum, position) => sum + position.pnl, 0);
  const totalFeesEarned = positions.reduce((sum, position) => sum + position.feesEarned, 0);
  const averageAPY = positions.length > 0
    ? positions.reduce((sum, position) => sum + position.apy, 0) / positions.length
    : 0;

  const pnlPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  const metrics = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      change: null,
      trend: null
    },
    {
      label: 'Total P&L',
      value: formatCurrency(totalPnL),
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      change: formatPercentage(pnlPercentage),
      trend: totalPnL >= 0 ? 'positive' : 'negative'
    },
    {
      label: 'Fees Earned',
      value: formatCurrency(totalFeesEarned),
      icon: Zap,
      change: null,
      trend: 'positive'
    },
    {
      label: 'Average APY',
      value: formatPercentage(averageAPY),
      icon: Activity,
      change: null,
      trend: averageAPY > 15 ? 'positive' : averageAPY > 5 ? 'neutral' : 'negative'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Overview</h2>
        <p className="text-gray-600">
          {positions.length} active position{positions.length !== 1 ? 's' : ''} across {pools.length} pool{pools.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  metric.trend === 'positive'
                    ? 'bg-green-100 text-green-600'
                    : metric.trend === 'negative'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {metric.change && (
                  <span className={`text-sm font-medium ${
                    metric.trend === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'positive' ? '+' : ''}{metric.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Portfolio Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{positions.length}</p>
            <p className="text-sm text-gray-600">Active Positions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {positions.filter(p => p.pnl > 0).length}
            </p>
            <p className="text-sm text-gray-600">Profitable Positions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {pools.length}
            </p>
            <p className="text-sm text-gray-600">Available Pools</p>
          </div>
        </div>
      </div>
    </div>
  );
}