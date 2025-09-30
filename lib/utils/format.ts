/**
 * Safe formatting utilities for handling nullable/undefined values
 * Prevents runtime errors when calling toLocaleString() on null/undefined
 */

/**
 * Safely format a number as currency
 * @param value - Number to format (can be null/undefined)
 * @param currency - Currency symbol (default: '$')
 * @param fallback - Fallback text when value is null/undefined
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = '$',
  fallback: string = '$0.00'
): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return `${currency}${value.toLocaleString()}`
}

/**
 * Safely format a number
 * @param value - Number to format (can be null/undefined)
 * @param fallback - Fallback text when value is null/undefined
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  fallback: string = '0'
): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return value.toLocaleString()
}

/**
 * Safely format a date/timestamp
 * @param date - Date string or Date object (can be null/undefined)
 * @param fallback - Fallback text when date is null/undefined
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  if (!date) {
    return fallback
  }
  try {
    return new Date(date).toLocaleString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return fallback
  }
}

/**
 * Safely format a date to short date format
 * @param date - Date string or Date object (can be null/undefined)
 * @param fallback - Fallback text when date is null/undefined
 * @returns Formatted short date string
 */
export function formatDateShort(
  date: string | Date | null | undefined,
  fallback: string = 'N/A'
): string {
  if (!date) {
    return fallback
  }
  try {
    return new Date(date).toLocaleDateString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return fallback
  }
}

/**
 * Safely format a percentage
 * @param value - Number to format as percentage (can be null/undefined)
 * @param decimals - Number of decimal places
 * @param fallback - Fallback text when value is null/undefined
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2,
  fallback: string = '0%'
): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return `${value.toFixed(decimals)}%`
}
