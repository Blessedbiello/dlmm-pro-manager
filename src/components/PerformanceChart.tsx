'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DLMMPosition } from '@/hooks/useDLMM';
import { formatCurrency } from '@/lib/utils';

interface PerformanceChartProps {
  positions: DLMMPosition[];
}

export function PerformanceChart({ positions }: PerformanceChartProps) {
  // Generate mock performance data based on positions
  const generatePerformanceData = () => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Calculate cumulative value based on positions
      const totalValue = positions.reduce((sum, position) => {
        // Simulate daily performance variation
        const dailyVariation = (Math.random() - 0.5) * 0.02; // ±1% daily variation
        const baseValue = position.tokenXAmount * 245 + position.tokenYAmount; // Approximate USD value
        const timeBasedGrowth = (29 - i) * 0.001; // Small daily growth
        return sum + baseValue * (1 + timeBasedGrowth + dailyVariation);
      }, 0);

      const fees = positions.reduce((sum, position) => {
        const dailyFees = position.feesEarned * ((29 - i) / 29); // Accumulate fees over time
        return sum + dailyFees;
      }, 0);

      const pnl = positions.reduce((sum, position) => {
        const dailyPnL = position.pnl * ((29 - i) / 29);
        return sum + dailyPnL;
      }, 0);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString(),
        totalValue: Math.round(totalValue * 100) / 100,
        fees: Math.round(fees * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
      });
    }

    return data;
  };

  const performanceData = generatePerformanceData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Chart</h3>
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600">No performance data available yet</p>
          <p className="text-sm text-gray-500 mt-1">Create positions to start tracking performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Performance Overview</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Total Value</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Fees Earned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">P&L</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="totalValueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#totalValueGradient)"
              name="Total Value"
            />
            <Line
              type="monotone"
              dataKey="fees"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Fees Earned"
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="P&L"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">30-Day Return</p>
          <p className="text-lg font-semibold text-green-600">+12.5%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Best Day</p>
          <p className="text-lg font-semibold text-blue-600">+3.2%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Worst Day</p>
          <p className="text-lg font-semibold text-red-600">-1.8%</p>
        </div>
      </div>
    </div>
  );
}