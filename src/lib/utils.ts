import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency values
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format token amounts
export function formatTokenAmount(amount: number, decimals: number = 6): string {
  const adjustedAmount = amount / Math.pow(10, decimals);

  if (adjustedAmount < 0.01) {
    return adjustedAmount.toExponential(2);
  }

  return adjustedAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// Truncate address
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Calculate APY
export function calculateAPY(feesEarned: number, liquidity: number, timeFrame: number = 24): number {
  if (liquidity === 0) return 0;
  const dailyReturn = feesEarned / liquidity;
  const annualReturn = dailyReturn * 365;
  return annualReturn * 100;
}

// Calculate position value
export function calculatePositionValue(
  tokenXAmount: number,
  tokenYAmount: number,
  tokenXPrice: number,
  tokenYPrice: number = 1
): number {
  return (tokenXAmount * tokenXPrice) + (tokenYAmount * tokenYPrice);
}

// Calculate price impact
export function calculatePriceImpact(
  currentPrice: number,
  targetPrice: number
): number {
  return ((targetPrice - currentPrice) / currentPrice) * 100;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Format large numbers
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Validate price range
export function validatePriceRange(lower: number, upper: number, current: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (lower >= upper) {
    errors.push('Lower price must be less than upper price');
  }

  if (lower <= 0 || upper <= 0) {
    errors.push('Price values must be positive');
  }

  if (current < lower || current > upper) {
    errors.push('Current price should be within the range for optimal liquidity');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Calculate optimal price range
export function calculateOptimalRange(currentPrice: number, volatility: number = 0.1): {
  lowerPrice: number;
  upperPrice: number;
} {
  const range = currentPrice * volatility;
  return {
    lowerPrice: Math.max(0.01, currentPrice - range),
    upperPrice: currentPrice + range
  };
}