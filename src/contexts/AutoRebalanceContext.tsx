'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AutoRebalanceConfig {
  positionId: string;
  enabled: boolean;
  priceDeviationThreshold: number; // % deviation from range center to trigger rebalance
  newRangeWidth: number; // % width of new range around current price
  minTimeBetweenRebalances: number; // minutes
  compoundFees: boolean;
  lastRebalanceTime?: number;
}

export interface RebalanceEvent {
  id: string;
  positionId: string;
  timestamp: number;
  oldRange: { lower: number; upper: number };
  newRange: { lower: number; upper: number };
  txHash: string;
  success: boolean;
}

interface AutoRebalanceContextType {
  configs: Record<string, AutoRebalanceConfig>;
  rebalanceHistory: RebalanceEvent[];
  updateConfig: (config: AutoRebalanceConfig) => void;
  removeConfig: (positionId: string) => void;
  getConfig: (positionId: string) => AutoRebalanceConfig | undefined;
  addRebalanceEvent: (event: RebalanceEvent) => void;
  isRebalancing: (positionId: string) => boolean;
  setRebalancing: (positionId: string, value: boolean) => void;
}

const AutoRebalanceContext = createContext<AutoRebalanceContextType | undefined>(undefined);

export function AutoRebalanceProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<Record<string, AutoRebalanceConfig>>({});
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceEvent[]>([]);
  const [rebalancingPositions, setRebalancingPositions] = useState<Set<string>>(new Set());

  // Load configs from localStorage on mount
  useEffect(() => {
    const savedConfigs = localStorage.getItem('autoRebalanceConfigs');
    const savedHistory = localStorage.getItem('rebalanceHistory');

    if (savedConfigs) {
      try {
        setConfigs(JSON.parse(savedConfigs));
      } catch (err) {
        console.error('Failed to load auto-rebalance configs:', err);
      }
    }

    if (savedHistory) {
      try {
        setRebalanceHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load rebalance history:', err);
      }
    }
  }, []);

  // Save configs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('autoRebalanceConfigs', JSON.stringify(configs));
  }, [configs]);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('rebalanceHistory', JSON.stringify(rebalanceHistory));
  }, [rebalanceHistory]);

  const updateConfig = (config: AutoRebalanceConfig) => {
    setConfigs(prev => ({
      ...prev,
      [config.positionId]: config
    }));
  };

  const removeConfig = (positionId: string) => {
    setConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[positionId];
      return newConfigs;
    });
  };

  const getConfig = (positionId: string) => {
    return configs[positionId];
  };

  const addRebalanceEvent = (event: RebalanceEvent) => {
    setRebalanceHistory(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events

    // Update last rebalance time in config
    if (event.success) {
      setConfigs(prev => ({
        ...prev,
        [event.positionId]: {
          ...prev[event.positionId],
          lastRebalanceTime: event.timestamp
        }
      }));
    }
  };

  const isRebalancing = (positionId: string) => {
    return rebalancingPositions.has(positionId);
  };

  const setRebalancing = (positionId: string, value: boolean) => {
    setRebalancingPositions(prev => {
      const newSet = new Set(prev);
      if (value) {
        newSet.add(positionId);
      } else {
        newSet.delete(positionId);
      }
      return newSet;
    });
  };

  return (
    <AutoRebalanceContext.Provider
      value={{
        configs,
        rebalanceHistory,
        updateConfig,
        removeConfig,
        getConfig,
        addRebalanceEvent,
        isRebalancing,
        setRebalancing
      }}
    >
      {children}
    </AutoRebalanceContext.Provider>
  );
}

export function useAutoRebalance() {
  const context = useContext(AutoRebalanceContext);
  if (!context) {
    throw new Error('useAutoRebalance must be used within AutoRebalanceProvider');
  }
  return context;
}
