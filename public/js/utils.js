/**
 * Utility functions for CASPER SYSTEM 24
 * Contains secure helper functions and validation utilities
 */

// Secure DOM query selector with validation
function $(selector) {
  if (typeof selector !== 'string' || !selector.trim()) {
    console.warn('Invalid selector provided to $()');
    return null;
  }

  try {
    return document.querySelector(selector);
  } catch (error) {
    console.error('Error in selector:', error);
    return null;
  }
}

// Secure element value getter with sanitization
function getValue(elementId) {
  const element = $(elementId);
  if (!element) {
    console.warn(`Element not found: ${elementId}`);
    return '';
  }

  const value = element.value || '';
  return String(value).trim();
}

// Input sanitization for HTML content
function sanitizeHtml(input) {
  if (typeof input !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Secure localStorage wrapper with error handling
const secureStorage = {
  get(key) {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid localStorage key');
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set(key, value) {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid localStorage key');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  remove(key) {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid localStorage key');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

// Validation functions
const validators = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num < 1000000;
  },

  isValidAmazonUrl(url) {
    if (!this.isValidUrl(url)) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('amazon.');
    } catch {
      return false;
    }
  }
};

// Secure notification system
const notifications = {
  show(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = $('.notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    // Sanitize message
    notification.textContent = sanitizeHtml(String(message));

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);

    return notification;
  },

  success(message) {
    return this.show(message, 'success');
  },

  error(message) {
    return this.show(message, 'error');
  },

  warning(message) {
    return this.show(message, 'warning');
  }
};

// Secure API request wrapper
async function secureApiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    timeout: 30000
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Add timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);

  try {
    const response = await fetch(url, {
      ...mergedOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error;
  }
}

// Rate limiting utility
const rateLimiter = (() => {
  const requests = new Map();

  return function (key, limit = 10, window = 60000) {
    const now = Date.now();
    const windowStart = now - window;

    // Clean old requests
    if (requests.has(key)) {
      requests.set(
        key,
        requests.get(key).filter(time => time > windowStart)
      );
    } else {
      requests.set(key, []);
    }

    const requestCount = requests.get(key).length;

    if (requestCount >= limit) {
      return false; // Rate limit exceeded
    }

    requests.get(key).push(now);
    return true; // Request allowed
  };
})();

// Debounce utility for performance
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

// Error reporting
function reportError(error, context = {}) {
  console.error('Application error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // Here you could send errors to a logging service
  // Example: sendToLoggingService(errorData);
}

// Set current year for copyright
function setCurrentYear() {
  const yearElement = $('#year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Initialize utils when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setCurrentYear);
} else {
  setCurrentYear();
}

// Export utilities for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    $,
    getValue,
    sanitizeHtml,
    secureStorage,
    validators,
    notifications,
    secureApiRequest,
    rateLimiter,
    debounce,
    reportError
  };
}
