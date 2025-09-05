/**
 * Utility functions for formatting data safely
 */

/**
 * Safely format a number as currency
 * @param value - The value to format (can be string, number, null, undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: any, decimals: number = 2): string => {
  try {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }
    
    // Convert to number safely
    const numValue = parseFloat(String(value));
    
    // Check if conversion resulted in NaN
    if (isNaN(numValue)) {
      return '0.00';
    }
    
    // Format with specified decimal places
    return numValue.toFixed(decimals);
  } catch (error) {
    console.warn('Error formatting currency:', error, 'value:', value);
    return '0.00';
  }
};

/**
 * Safely parse a value as a number
 * @param value - The value to parse
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Parsed number
 */
export const safeParseNumber = (value: any, defaultValue: number = 0): number => {
  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const numValue = parseFloat(String(value));
    return isNaN(numValue) ? defaultValue : numValue;
  } catch (error) {
    console.warn('Error parsing number:', error, 'value:', value);
    return defaultValue;
  }
};

/**
 * Safely format a number with specified decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: any, decimals: number = 2, defaultValue: number = 0): string => {
  try {
    const numValue = safeParseNumber(value, defaultValue);
    return numValue.toFixed(decimals);
  } catch (error) {
    console.warn('Error formatting number:', error, 'value:', value);
    return defaultValue.toFixed(decimals);
  }
};