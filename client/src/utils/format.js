/**
 * Frontend Formatting Utilities
 */

/**
 * Format currency based on organization settings or defaults
 * @param {number} amount - The numeric value to format
 * @param {object} organization - The organization object from auth state
 * @returns {string} - Formatted currency string (e.g., "$100.00", "₹100")
 */
export const formatCurrency = (amount, organization) => {
  const currency = organization?.settings?.currency || 'USD';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Get currency symbol based on organization settings
 * @param {object} organization - The organization object from auth state
 * @returns {string} - Currency symbol (e.g., "$", "₹")
 */
export const getCurrencySymbol = (organization) => {
  const currency = organization?.settings?.currency || 'USD';
  return (0).toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/\d/g, '').trim();
};

/**
 * Format date based on organization settings or defaults
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time based on organization settings or defaults
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
