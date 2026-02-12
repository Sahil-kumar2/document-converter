/**
 * CORS configuration helper
 * Loads allowed origins from environment variables
 */

/**
 * Parse CORS origins from environment variable
 * Format: comma-separated list of origins
 * Example: http://localhost:5173,http://localhost:5174,https://example.com
 *
 * @returns {string|string[]} Single origin, array of origins, or function
 */
function parseCorsOrigins() {
  const originsEnv = process.env.CORS_ORIGINS || "";

  if (!originsEnv.trim()) {
    // Default to development if not configured
    return [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ];
  }

  const origins = originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // For production, validate origins
  if (process.env.NODE_ENV === "production") {
    const hasLocalhost = origins.some((origin) => origin.includes("localhost"));
    if (hasLocalhost) {
      console.warn(
        "⚠️  WARNING: localhost origins detected in production. Remove before deploying."
      );
    }
  }

  return origins;
}

/**
 * Parse exposed headers from environment variable
 * Format: comma-separated list of header names
 *
 * @returns {string[]} Array of header names
 */
function parseExposedHeaders() {
  const headersEnv = process.env.CORS_EXPOSED_HEADERS || "";

  const defaultHeaders = [
    "Content-Disposition",
    "X-Original-Size",
    "X-Compressed-Size",
  ];

  if (!headersEnv.trim()) {
    return defaultHeaders;
  }

  const headers = headersEnv
    .split(",")
    .map((header) => header.trim())
    .filter((header) => header.length > 0);

  return headers.length > 0 ? headers : defaultHeaders;
}

/**
 * Get CORS configuration object
 * Automatically handles function-based origin validation for dynamic scenarios
 *
 * @returns {Object} CORS configuration for express.cors()
 */
export function getCorsConfig() {
  const origins = parseCorsOrigins();
  const exposedHeaders = parseExposedHeaders();

  // Use function for dynamic origin validation if origins contain wildcards
  const originConfig = origins.some((origin) => origin.includes("*"))
    ? (origin, callback) => {
        callback(null, true); // Allow all origins if wildcard present
      }
    : origins;

  return {
    origin: originConfig,
    exposedHeaders,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    maxAge: 3600, // 1 hour
  };
}

/**
 * Log CORS configuration on startup (for debugging)
 */
export function logCorsConfig() {
  const origins = parseCorsOrigins();
  const headers = parseExposedHeaders();

  console.log("✓ CORS Configuration:");
  console.log(`  Origins: ${origins.join(", ")}`);
  console.log(`  Exposed Headers: ${headers.join(", ")}`);
  console.log(`  Credentials: enabled`);
}
