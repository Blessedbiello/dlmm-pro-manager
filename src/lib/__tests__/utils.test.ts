import { describe, it, expect } from 'vitest';
import { formatCurrency, cn } from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-123.45);
      expect(result).toBe('-$123.45');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toBe('$1,000,000.00');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(1.999);
      expect(result).toBe('$2.00');
    });
  });

  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', { active: true, disabled: false });
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
    });

    it('should filter out falsy values', () => {
      const result = cn('base', null, undefined, false, 'other');
      expect(result).toBe('base other');
    });
  });
});
