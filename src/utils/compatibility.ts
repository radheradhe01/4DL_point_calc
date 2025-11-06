/**
 * Browser compatibility utilities and feature detection
 */

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if date input type is supported
 */
export function isDateInputSupported(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const input = document.createElement('input');
  input.setAttribute('type', 'date');
  return input.type === 'date';
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /Android/.test(navigator.userAgent);
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  const ua = navigator.userAgent;
  if (ua.indexOf('Chrome') > -1) return 'chrome';
  if (ua.indexOf('Firefox') > -1) return 'firefox';
  if (ua.indexOf('Safari') > -1) return 'safari';
  if (ua.indexOf('Edge') > -1) return 'edge';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'opera';
  return 'unknown';
}

/**
 * Format date for display (fallback for browsers without date input)
 */
export function formatDateForInput(date: string): string {
  // Ensure date is in YYYY-MM-DD format
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date from various formats
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try ISO format first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try common formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD
        return new Date(`${match[1]}-${match[2]}-${match[3]}`);
      } else if (format === formats[1]) {
        // MM/DD/YYYY
        return new Date(`${match[3]}-${match[1]}-${match[2]}`);
      } else if (format === formats[2]) {
        // MM-DD-YYYY
        return new Date(`${match[3]}-${match[1]}-${match[2]}`);
      }
    }
  }
  
  return null;
}

