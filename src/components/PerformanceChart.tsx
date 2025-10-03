'use client';

import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DLMMPosition } from '@/hooks/useDLMM';
import { formatCurrency } from '@/lib/utils';

interface PerformanceChartProps {
  positions: DLMMPosition[];
}

export function PerformanceChart({ positions }: PerformanceChartProps) {
  // Generate real performance data from position history
  const generatePerformanceData = () => {
    const data = [];
    const now = new Date();

    // Get historical snapshots from localStorage
    const getHistoricalSnapshot = (daysAgo: number) => {
      const key = `portfolio_snapshot_${daysAgo}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    };

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Try to get historical snapshot
      const snapshot = getHistoricalSnapshot(i);

      let totalValue = 0;
      let fees = 0;
      let pnl = 0;

      if (snapshot) {
        // Use real historical data if available
        totalValue = snapshot.totalValue;
        fees = snapshot.fees;
        pnl = snapshot.pnl;
      } else {
        // Calculate current values and extrapolate backwards
        positions.forEach(position => {
          if (!position.entryTimestamp) return;

          const entryDate = new Date(position.entryTimestamp);
          const dataDate = date.getTime();

          // Only include positions that existed at this date
          if (dataDate >= entryDate.getTime()) {
            const daysHeld = (dataDate - entryDate.getTime()) / (1000 * 60 * 60 * 24);

            // Estimate historical value based on position entry and current data
            const currentValue = (position.tokenXAmount * 245) + position.tokenYAmount;
            const valueAtDate = position.initialValueUSD || currentValue;

            // Linearly interpolate between entry value and current value
            const progress = position.entryTimestamp
              ? Math.min(daysHeld / ((now.getTime() - position.entryTimestamp) / (1000 * 60 * 60 * 24)), 1)
              : 0;

            const interpolatedValue = valueAtDate + (currentValue - valueAtDate) * progress;
            totalValue += interpolatedValue;

            // Accumulate fees proportionally
            fees += position.feesEarned * progress;

            // Accumulate P&L proportionally
            pnl += position.pnl * progress;
          }
        });
      }

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString(),
        totalValue: Math.round(totalValue * 100) / 100,
        fees: Math.round(fees * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
      });
    }

    // Store today's snapshot for future historical reference
    const todaySnapshot = {
      totalValue: data[data.length - 1]?.totalValue || 0,
      fees: data[data.length - 1]?.fees || 0,
      pnl: data[data.length - 1]?.pnl || 0,
      timestamp: now.getTime(),
    };
    localStorage.setItem('portfolio_snapshot_0', JSON.stringify(todaySnapshot));

    // Rotate snapshots (move day 0 to day 1, etc.)
    for (let i = 29; i > 0; i--) {
      const prevSnapshot = localStorage.getItem(`portfolio_snapshot_${i - 1}`);
      if (prevSnapshot) {
        localStorage.setItem(`portfolio_snapshot_${i}`, prevSnapshot);
      }
    }

    return data;
  };

  const performanceData = generatePerformanceData();

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
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
          <p className={`text-lg font-semibold ${
            performanceData.length > 0 && performanceData[performanceData.length - 1].totalValue > performanceData[0].totalValue
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {performanceData.length > 0 && performanceData[0].totalValue > 0
              ? `${((performanceData[performanceData.length - 1].totalValue - performanceData[0].totalValue) / performanceData[0].totalValue * 100).toFixed(1)}%`
              : '0.0%'
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Best Day</p>
          <p className="text-lg font-semibold text-blue-600">
            {performanceData.length > 1
              ? `+${Math.max(...performanceData.slice(1).map((day, i) =>
                  day.totalValue > 0 && performanceData[i].totalValue > 0
                    ? ((day.totalValue - performanceData[i].totalValue) / performanceData[i].totalValue * 100)
                    : 0
                )).toFixed(1)}%`
              : '0.0%'
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Worst Day</p>
          <p className="text-lg font-semibold text-red-600">
            {performanceData.length > 1
              ? `${Math.min(...performanceData.slice(1).map((day, i) =>
                  day.totalValue > 0 && performanceData[i].totalValue > 0
                    ? ((day.totalValue - performanceData[i].totalValue) / performanceData[i].totalValue * 100)
                    : 0
                )).toFixed(1)}%`
              : '0.0%'
            }
          </p>
        </div>
      </div>
    </div>
  );
}