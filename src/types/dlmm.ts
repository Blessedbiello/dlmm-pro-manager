export interface Token {
  symbol: string;
  mint: string;
  decimals: number;
  logoURI?: string;
}

export interface Pool {
  address: string;
  tokenX: Token;
  tokenY: Token;
  currentPrice: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  activeBin: number;
  binStep: number;
}

export interface Position {
  id: string;
  poolAddress: string;
  pool?: Pool;
  lowerPrice: number;
  upperPrice: number;
  liquidity: number;
  tokenXAmount: number;
  tokenYAmount: number;
  feesEarned: number;
  pnl: number;
  apy: number;
  status: 'active' | 'inactive' | 'out_of_range';
  createdAt: Date;
  lastUpdated: Date;
}

export interface PositionAnalytics {
  totalValue: number;
  totalPnL: number;
  totalFeesEarned: number;
  averageAPY: number;
  positionCount: number;
  activePositions: number;
  inRangePositions: number;
}

export interface RebalanceStrategy {
  id: string;
  name: string;
  positionId: string;
  enabled: boolean;
  priceThreshold: number;
  rebalanceFrequency: 'hourly' | 'daily' | 'weekly';
  minProfitThreshold: number;
  maxSlippage: number;
  lastRebalance?: Date;
}

export interface OrderType {
  id: string;
  type: 'limit' | 'stop_loss' | 'take_profit' | 'dca';
  positionId: string;
  targetPrice: number;
  amount: number;
  status: 'pending' | 'executed' | 'cancelled';
  createdAt: Date;
  expiresAt?: Date;
}

export interface BacktestResult {
  strategy: string;
  period: {
    start: Date;
    end: Date;
  };
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
  avgPositionDuration: number;
}

export interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface LiquidityDistribution {
  binId: number;
  price: number;
  liquidity: number;
  tokenXAmount: number;
  tokenYAmount: number;
}

export interface TransactionHistory {
  id: string;
  type: 'add_liquidity' | 'remove_liquidity' | 'collect_fees' | 'rebalance';
  positionId: string;
  timestamp: Date;
  transactionHash: string;
  amount: number;
  fees: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  totalFeesEarned: number;
  averageAPY: number;
  bestPerformingPosition: Position | null;
  worstPerformingPosition: Position | null;
  riskScore: number;
}

export interface AlertConfig {
  id: string;
  type: 'price_threshold' | 'position_out_of_range' | 'high_fees' | 'rebalance_needed';
  enabled: boolean;
  threshold: number;
  email?: string;
  telegram?: string;
  discord?: string;
}