/**
 * Helper function to handle number input focus
 * Selects all text when the input is focused for easier editing
 */
export const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

/**
 * Format number input value
 * Returns empty string if value is 0 or undefined, otherwise returns the value
 * This prevents showing '0' in empty fields
 */
export const formatNumberInputValue = (value: number | undefined): string | number => {
  return value || '';
};

/**
 * Parse number input value
 * Returns undefined if empty string, otherwise parses to number
 */
export const parseNumberInputValue = (value: string): number | undefined => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
};

