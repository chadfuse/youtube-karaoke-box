/**
 * Security validation for admin header scripts
 * Allows only safe, whitelisted patterns to prevent XSS attacks
 */

// Maximum allowed length for header scripts (10KB)
const MAX_SCRIPT_LENGTH = 10000;

// Allowed patterns for header scripts
const ALLOWED_PATTERNS = [
  // Google Analytics gtag.js (with optional async attribute)
  /^<script(\s+async)?\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[A-Z0-9-]+"><\/script>$/,
  
  // Google Analytics inline config (multi-line with proper escaping)
  /^<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\];\s*function\s+gtag\(\)\s*\{\s*dataLayer\.push\(arguments\);\s*\}\s*gtag\('js',\s*new\s+Date\(\)\);\s*gtag\('config',\s*'[A-Z0-9-]+'\);\s*<\/script>$/s,
  
  // Custom CSS only (no script tags or event handlers)
  /^<style>[^<]*<\/style>$/,
  
  // Meta tags (viewport, charset, description, etc.)
  /^<meta\s+[^>]*>$/,
  
  // Link tags for external CSS (HTTPS only)
  /^<link\s+rel="stylesheet"\s+href="https:\/\/[a-zA-Z0-9\-\.\/]+"(\s+integrity="[^"]*")?(\s+crossorigin="[^"]*")?\s*\/?>$/
];

/**
 * Validates header script content against whitelist patterns
 */
export const validateHeaderScript = (content: string): boolean => {
  // Check length
  if (content.length > MAX_SCRIPT_LENGTH) {
    console.error('Header script exceeds maximum length');
    return false;
  }

  // Strip HTML comments to allow GA snippets with comments
  const withoutComments = content.replace(/<!--[\s\S]*?-->/g, '');

  // Empty content is allowed
  if (!withoutComments.trim()) {
    return true;
  }

  // Split into individual tags and validate each
  const tags = withoutComments
    .trim()
    .split(/(?=<)(?!<\/)/) // Split on opening tags but not closing tags
    .filter(tag => tag.trim());

  for (const tag of tags) {
    const trimmedTag = tag.trim();
    const isValid = ALLOWED_PATTERNS.some(pattern => pattern.test(trimmedTag));
    
    if (!isValid) {
      console.error('Header script contains disallowed pattern:', trimmedTag);
      return false;
    }
  }

  return true;
};

/**
 * Validates YouTube API key format
 */
export const validateYouTubeApiKey = (key: string): { isValid: boolean; error?: string } => {
  const trimmed = key.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'API key cannot be empty' };
  }
  
  // YouTube API keys are typically 39 characters, alphanumeric with dash/underscore
  if (!/^[A-Za-z0-9_-]{35,45}$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid API key format' };
  }
  
  return { isValid: true };
};

/**
 * Validates region code format
 */
export const validateRegionCode = (code: string): { isValid: boolean; error?: string } => {
  const trimmed = code.trim().toUpperCase();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Region code cannot be empty' };
  }
  
  // Must be 2-character ISO 3166-1 alpha-2 code
  if (!/^[A-Z]{2}$/.test(trimmed)) {
    return { isValid: false, error: 'Region code must be 2 letters (e.g., US, GB, CA)' };
  }
  
  return { isValid: true };
};
