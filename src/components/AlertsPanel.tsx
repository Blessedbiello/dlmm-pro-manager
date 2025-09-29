'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Bell, X, Settings } from 'lucide-react';
import { DLMMPosition } from '@/hooks/useDLMM';

interface AlertsPanelProps {
  positions: DLMMPosition[];
}

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  positionId?: string;
  actionRequired?: boolean;
}

export function AlertsPanel({ positions }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    // Generate alerts based on positions
    const generatedAlerts: Alert[] = [];

    positions.forEach((position) => {
      // Out of range alert
      const isOutOfRange = position.pnl < 0; // Simplified check
      if (isOutOfRange) {
        generatedAlerts.push({
          id: `out-of-range-${position.id}`,
          type: 'warning',
          title: 'Position Out of Range',
          message: `Your position may be earning reduced fees`,
          timestamp: new Date(),
          positionId: position.id,
          actionRequired: true
        });
      }

      // High fees alert
      if (position.feesEarned > 10) {
        generatedAlerts.push({
          id: `high-fees-${position.id}`,
          type: 'success',
          title: 'High Fee Earnings',
          message: `You've earned ${position.feesEarned.toFixed(2)} in fees!`,
          timestamp: new Date(),
          positionId: position.id,
          actionRequired: false
        });
      }

      // Rebalance suggestion
      if (position.apy < 5) {
        generatedAlerts.push({
          id: `low-apy-${position.id}`,
          type: 'info',
          title: 'Consider Rebalancing',
          message: `Position APY is ${position.apy.toFixed(1)}% - consider adjusting range`,
          timestamp: new Date(),
          positionId: position.id,
          actionRequired: true
        });
      }
    });

    return generatedAlerts;
  });

  const [showSettings, setShowSettings] = useState(false);

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Alerts</h3>
          {alerts.length > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">All good!</p>
          <p className="text-sm text-gray-500 mt-1">No alerts at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertStyles(alert.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                    {alert.actionRequired && (
                      <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Alert Settings */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Preferences</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Position out of range</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">High fee earnings</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Rebalance suggestions</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Price threshold alerts</span>
          </label>
        </div>
      </div>

      {/* Alert Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Alert Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notification Methods</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">In-app notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Telegram bot</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Discord webhook</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Price deviation (%)</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Minimum fee threshold ($)</label>
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Low APY threshold (%)</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}