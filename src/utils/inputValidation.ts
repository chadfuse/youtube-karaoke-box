import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

// Maximum allowed lengths for different input types
export const INPUT_LIMITS = {
  SEARCH_QUERY: 200,
  API_KEY: 100,
  REGION_CODE: 5,
  DISPLAY_NAME: 50,
} as const;

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [] // No attributes allowed
  });
};

/**
 * Validates and sanitizes search query input
 */
export const validateSearchQuery = (query: string): { isValid: boolean; sanitized: string; error?: string } => {
  // Trim whitespace
  const trimmed = query.trim();
  
  // Check length
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Search query cannot be empty' };
  }
  
  if (trimmed.length > INPUT_LIMITS.SEARCH_QUERY) {
    return { 
      isValid: false, 
      sanitized: '', 
      error: `Search query too long (max ${INPUT_LIMITS.SEARCH_QUERY} characters)` 
    };
  }
  
  // Sanitize the input
  const sanitized = sanitizeHtml(trimmed);
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiting helper for search requests
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests = 10, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    // Check if within rate limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
}

// Global rate limiter instance for search requests
export const searchRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute