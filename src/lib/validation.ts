export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate price range for DLMM position
export function validatePriceRange(
  lowerPrice: number,
  upperPrice: number,
  currentPrice: number
): ValidationResult {
  if (lowerPrice <= 0) {
    return { valid: false, error: 'Lower price must be greater than 0' };
  }

  if (upperPrice <= 0) {
    return { valid: false, error: 'Upper price must be greater than 0' };
  }

  if (lowerPrice >= upperPrice) {
    return { valid: false, error: 'Lower price must be less than upper price' };
  }

  if (upperPrice <= currentPrice) {
    return {
      valid: false,
      error: 'Upper price must be greater than current price for a valid range',
    };
  }

  if (lowerPrice >= currentPrice) {
    return {
      valid: false,
      error: 'Lower price must be less than current price for a valid range',
    };
  }

  // Check if range is too narrow (less than 1%)
  const rangePercent = ((upperPrice - lowerPrice) / lowerPrice) * 100;
  if (rangePercent < 1) {
    return {
      valid: false,
      error: 'Price range is too narrow. Minimum range is 1%',
    };
  }

  // Warn if range is too wide (more than 100%)
  if (rangePercent > 100) {
    return {
      valid: false,
      error: 'Price range is too wide. Maximum recommended range is 100%',
    };
  }

  return { valid: true };
}

// Validate token amounts
export function validateTokenAmounts(
  tokenXAmount: number,
  tokenYAmount: number,
  minAmount: number = 0.001,
  maxAmount: number = 1000000
): ValidationResult {
  if (tokenXAmount < minAmount && tokenYAmount < minAmount) {
    return {
      valid: false,
      error: `At least one token amount must be greater than ${minAmount}`,
    };
  }

  if (tokenXAmount < 0 || tokenYAmount < 0) {
    return { valid: false, error: 'Token amounts cannot be negative' };
  }

  if (tokenXAmount > maxAmount || tokenYAmount > maxAmount) {
    return {
      valid: false,
      error: `Token amounts cannot exceed ${maxAmount}`,
    };
  }

  return { valid: true };
}

// Calculate slippage for a position
export function calculateSlippage(
  expectedPrice: number,
  actualPrice: number
): number {
  return Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100;
}

// Validate slippage tolerance
export function validateSlippage(
  expectedPrice: number,
  actualPrice: number,
  maxSlippagePercent: number
): ValidationResult {
  const slippage = calculateSlippage(expectedPrice, actualPrice);

  if (slippage > maxSlippagePercent) {
    return {
      valid: false,
      error: `Slippage (${slippage.toFixed(2)}%) exceeds maximum tolerance (${maxSlippagePercent}%)`,
    };
  }

  return { valid: true };
}

// Validate wallet balance
export function validateBalance(
  requiredAmount: number,
  availableBalance: number,
  symbol: string
): ValidationResult {
  if (requiredAmount > availableBalance) {
    return {
      valid: false,
      error: `Insufficient ${symbol} balance. Required: ${requiredAmount.toFixed(4)}, Available: ${availableBalance.toFixed(4)}`,
    };
  }

  // Reserve some tokens for transaction fees
  const reserveAmount = 0.01; // 0.01 SOL reserve for fees
  if (symbol === 'SOL' && availableBalance - requiredAmount < reserveAmount) {
    return {
      valid: false,
      error: `Insufficient balance for transaction fees. Please keep at least ${reserveAmount} SOL for fees`,
    };
  }

  return { valid: true };
}

// Validate rebalance strategy
export function validateRebalanceConfig(
  priceDeviationThreshold: number,
  rangeWidth: number,
  cooldownPeriod: number
): ValidationResult {
  if (priceDeviationThreshold < 1 || priceDeviationThreshold > 50) {
    return {
      valid: false,
      error: 'Price deviation threshold must be between 1% and 50%',
    };
  }

  if (rangeWidth < 5 || rangeWidth > 100) {
    return {
      valid: false,
      error: 'Range width must be between 5% and 100%',
    };
  }

  if (cooldownPeriod < 60 || cooldownPeriod > 86400) {
    return {
      valid: false,
      error: 'Cooldown period must be between 1 minute and 24 hours',
    };
  }

  return { valid: true };
}

// Validate order parameters
export function validateOrderParams(
  orderType: 'limit' | 'stop_loss' | 'take_profit',
  targetPrice: number,
  currentPrice: number
): ValidationResult {
  if (targetPrice <= 0) {
    return { valid: false, error: 'Target price must be greater than 0' };
  }

  if (orderType === 'limit') {
    // Limit orders should be at a different price than current
    const priceDiff = Math.abs(targetPrice - currentPrice) / currentPrice;
    if (priceDiff < 0.001) {
      return {
        valid: false,
        error: 'Limit order price must be at least 0.1% different from current price',
      };
    }
  }

  if (orderType === 'stop_loss') {
    if (targetPrice >= currentPrice) {
      return {
        valid: false,
        error: 'Stop-loss price must be below current price',
      };
    }
  }

  if (orderType === 'take_profit') {
    if (targetPrice <= currentPrice) {
      return {
        valid: false,
        error: 'Take-profit price must be above current price',
      };
    }
  }

  return { valid: true };
}

// Estimate gas costs for a transaction
export function estimateGasCost(
  transactionType: 'create_position' | 'remove_liquidity' | 'rebalance' | 'collect_fees'
): number {
  const baseFee = 0.000005; // Base transaction fee in SOL

  switch (transactionType) {
    case 'create_position':
      return baseFee * 2; // Position creation involves multiple instructions
    case 'remove_liquidity':
      return baseFee * 1.5;
    case 'rebalance':
      return baseFee * 3.5; // Remove + create position
    case 'collect_fees':
      return baseFee * 1;
    default:
      return baseFee;
  }
}

// Check if transaction is economical
export function isTransactionEconomical(
  expectedProfit: number,
  gasCost: number,
  minProfitMultiplier: number = 2
): ValidationResult {
  const minProfit = gasCost * minProfitMultiplier;

  if (expectedProfit < minProfit) {
    return {
      valid: false,
      error: `Transaction not economical. Expected profit (${expectedProfit.toFixed(6)}) should be at least ${minProfitMultiplier}x gas cost (${minProfit.toFixed(6)})`,
    };
  }

  return { valid: true };
}
