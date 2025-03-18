/**
 * API Key Manager for OpenRouter
 *
 * This utility manages rotation between multiple OpenRouter API keys
 * to bypass rate limits (200 requests per day, 20 requests per 10 seconds per key).
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Store all OpenRouter API keys
const OPENROUTER_API_KEYS = [
  process.env.OPENROUTER_API_KEY!, // az
  process.env.OPENROUTER_API_KEY_G1!, // g
  process.env.OPENROUTER_API_KEY_G2!, // g
  process.env.OPENROUTER_API_KEY_N1!, // n
  process.env.OPENROUTER_API_KEY_N2!, // n
  process.env.OPENROUTER_API_KEY_L!, // l
  process.env.OPENROUTER_API_KEY_K!, // k
  process.env.OPENROUTER_API_KEY_V!, // v
  process.env.OPENROUTER_API_KEY_UNNAMED!,
  process.env.OPENROUTER_API_KEY_W_FALLBACK!, // w (fallback key)
];

// Track API key usage
interface KeyUsage {
  requestCount: number;
  lastUsed: Date;
  errorCount: number;
  totalRequests: number; // Total requests made with this key
  successfulRequests: number; // Successful requests made with this key
  isAvailable: boolean; // Whether this key is available for use
  restUntil: Date | null; // Timestamp until when the key is resting
}

// Initialize usage tracking for all keys
const keyUsage: KeyUsage[] = OPENROUTER_API_KEYS.map((key) => ({
  requestCount: 0,
  lastUsed: new Date(0), // Initialize with epoch time
  errorCount: 0,
  totalRequests: 0,
  successfulRequests: 0,
  isAvailable: key?.trim() !== "", // Mark empty keys as unavailable
  restUntil: null, // Not resting initially
}));

// Current key index
let currentKeyIndex = 0;

// Index of the ultimate fallback key (key 10)
const FALLBACK_KEY_INDEX = 9;

// Maximum requests per key before rotating
const MAX_REQUESTS_PER_KEY = 20;

// Maximum errors before marking a key as potentially problematic
const MAX_ERRORS_BEFORE_SKIP = 3;

// Time window to reset error count (1 hour in milliseconds)
const ERROR_RESET_WINDOW = 60 * 60 * 1000;

// Rest period after a key handles MAX_REQUESTS_PER_KEY requests (12 seconds)
const REST_PERIOD_MS = 12 * 1000;

// Track overall usage
const globalStats = {
  totalRequests: 0,
  successfulRequests: 0,
  totalErrors: 0,
  startTime: new Date(),
};

/**
 * Check if a key is available for use
 * @param index The index of the key to check
 * @returns Whether the key is available
 */
function isKeyAvailable(index: number): boolean {
  // Key is available if:
  // 1. It has a non-empty value
  // 2. It has fewer errors than the threshold
  // 3. It hasn't reached the request limit
  // 4. It's not in a rest period
  const usage = keyUsage[index];
  const key = OPENROUTER_API_KEYS[index];
  const now = new Date();

  // Reset error count if it's been a while since the last error
  if (
    usage.errorCount > 0 &&
    now.getTime() - usage.lastUsed.getTime() > ERROR_RESET_WINDOW
  ) {
    usage.errorCount = 0;
  }

  // Check if the key is currently in a rest period
  const isResting = usage.restUntil !== null && now < usage.restUntil;

  return (
    usage.isAvailable &&
    key.trim() !== "" &&
    usage.errorCount < MAX_ERRORS_BEFORE_SKIP &&
    usage.requestCount < MAX_REQUESTS_PER_KEY &&
    !isResting
  );
}

/**
 * Get the next available API key index using sequential fallback
 * @returns The index of the next available API key
 */
function getNextKeyIndex(): number {
  // Start from the key after the current one and wrap around
  const startIndex = (currentKeyIndex + 1) % OPENROUTER_API_KEYS.length;

  // Try keys in sequential order starting from the next key
  for (let i = 0; i < FALLBACK_KEY_INDEX; i++) {
    const keyIndex = (startIndex + i) % FALLBACK_KEY_INDEX;
    if (isKeyAvailable(keyIndex)) {
      return keyIndex;
    }
  }

  // If keys 1-9 are unavailable, use the fallback key (key 10)
  if (isKeyAvailable(FALLBACK_KEY_INDEX)) {
    return FALLBACK_KEY_INDEX;
  }

  // If even the fallback key is unavailable, try any other available key
  for (let i = FALLBACK_KEY_INDEX + 1; i < OPENROUTER_API_KEYS.length; i++) {
    if (isKeyAvailable(i)) {
      return i;
    }
  }

  // If all keys are unavailable, use the fallback key anyway as last resort
  console.warn(
    "All API keys are unavailable. Using fallback key as last resort."
  );
  return FALLBACK_KEY_INDEX;
}

/**
 * Get the current OpenRouter API key and rotate if necessary
 * @returns The current OpenRouter API key to use
 */
export function getOpenRouterApiKey(): string {
  // Check if current key is still available
  if (!isKeyAvailable(currentKeyIndex)) {
    // Current key is not available, find a new one
    currentKeyIndex = getNextKeyIndex();
    console.log(
      `Rotating to OpenRouter API key ${currentKeyIndex + 1}/${
        OPENROUTER_API_KEYS.length
      } due to availability issues`
    );
  }

  // Get current key usage
  const usage = keyUsage[currentKeyIndex];

  // Increment request count
  usage.requestCount++;
  usage.lastUsed = new Date();
  usage.totalRequests++;

  // Update global stats
  globalStats.totalRequests++;

  // Check if we need to rotate to the next key due to request limit
  if (usage.requestCount >= MAX_REQUESTS_PER_KEY) {
    // Set the rest period for this key
    const now = new Date();
    usage.restUntil = new Date(now.getTime() + REST_PERIOD_MS);
    console.log(
      `API key ${
        currentKeyIndex + 1
      } has reached request limit. Resting until ${usage.restUntil.toISOString()}`
    );

    // Reset request count
    usage.requestCount = 0;

    // Move to next key
    const previousKeyIndex = currentKeyIndex;
    currentKeyIndex = getNextKeyIndex();

    // Log key rotation
    if (previousKeyIndex !== currentKeyIndex) {
      console.log(
        `Rotating from key ${previousKeyIndex + 1} to OpenRouter API key ${
          currentKeyIndex + 1
        }/${OPENROUTER_API_KEYS.length} due to request limit`
      );
    }
  }

  return OPENROUTER_API_KEYS[currentKeyIndex];
}

/**
 * Record a successful API call
 */
export function recordApiKeySuccess(): void {
  const usage = keyUsage[currentKeyIndex];
  usage.successfulRequests++;

  // Update global stats
  globalStats.successfulRequests++;
}

/**
 * Record an error for the current API key
 */
export function recordApiKeyError(): void {
  const usage = keyUsage[currentKeyIndex];
  usage.errorCount++;

  // Update global stats
  globalStats.totalErrors++;

  console.error(
    `Error with OpenRouter API key ${currentKeyIndex + 1}. Error count: ${
      usage.errorCount
    }`
  );

  // If we've hit the error threshold, mark as unavailable and force rotation
  if (usage.errorCount >= MAX_ERRORS_BEFORE_SKIP) {
    console.warn(
      `OpenRouter API key ${
        currentKeyIndex + 1
      } has reached error threshold. Marking as unavailable.`
    );
    // Force rotation on next request
    usage.requestCount = MAX_REQUESTS_PER_KEY;
  }
}

/**
 * Create an OpenRouter client with the current API key
 * This function is meant to be used with the OpenRouter SDK
 */
export function createOpenRouterClient() {
  const apiKey = getOpenRouterApiKey();
  return createOpenRouter({
    apiKey,
  });
}

/**
 * Wrapper function to handle API calls with automatic retry on failure
 * @param apiCall The API call function to execute
 * @param maxRetries Maximum number of retries before giving up
 * @returns The result of the API call
 */
export async function withApiKeyRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;
  const retriesPerKey = new Map<number, number>();
  const triedKeys = new Set<number>();
  const MAX_RETRIES_PER_KEY = 1;

  while (retries <= maxRetries) {
    try {
      const result = await apiCall();
      recordApiKeySuccess();
      return result;
    } catch (error) {
      // Record the error with the current key
      recordApiKeyError();

      // Add current key to tried keys
      triedKeys.add(currentKeyIndex);

      // Track retries for this specific key
      const keyRetries = retriesPerKey.get(currentKeyIndex) || 0;
      retriesPerKey.set(currentKeyIndex, keyRetries + 1);

      // Increment retry count
      retries++;

      // If we've reached max retries, throw the error
      if (retries > maxRetries) {
        throw error;
      }

      // Check if we should try the same key again or move to the next one
      if ((retriesPerKey.get(currentKeyIndex) || 0) < MAX_RETRIES_PER_KEY) {
        // Try the same key again
        console.log(
          `Retry ${retries}/${maxRetries}: Trying API key ${
            currentKeyIndex + 1
          } again (attempt ${
            (retriesPerKey.get(currentKeyIndex) || 0) + 1
          }/${MAX_RETRIES_PER_KEY})`
        );
      } else {
        // We've tried this key enough times, move to the next one
        const previousKeyIndex = currentKeyIndex;

        // Get the next key in sequence
        if (currentKeyIndex < FALLBACK_KEY_INDEX - 1) {
          // Move to the next key in sequence (1-9)
          currentKeyIndex = currentKeyIndex + 1;
        } else if (currentKeyIndex === FALLBACK_KEY_INDEX - 1) {
          // We've tried all keys 1-9, move to fallback key (10)
          currentKeyIndex = FALLBACK_KEY_INDEX;
        } else if (currentKeyIndex === FALLBACK_KEY_INDEX) {
          // We've tried the fallback key, start over from key 1
          currentKeyIndex = 0;
        } else {
          // For any other keys, use the standard rotation logic
          currentKeyIndex = getNextKeyIndex();
        }

        console.log(
          `Retry ${retries}/${maxRetries}: Switching from key ${
            previousKeyIndex + 1
          } to key ${currentKeyIndex + 1} after ${MAX_RETRIES_PER_KEY} attempts`
        );
      }

      // Wait a bit before retrying (minimal delay for faster response)
      const delay = Math.min(20 * Math.pow(1.5, retries), 300);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the loop
  throw new Error("Maximum retries exceeded");
}

/**
 * Get usage statistics for all API keys
 * @returns Object containing usage statistics
 */
export function getApiKeyStats() {
  const now = new Date();
  const uptime = now.getTime() - globalStats.startTime.getTime();
  const uptimeHours = uptime / (1000 * 60 * 60);

  const keyStats = keyUsage.map((usage, index) => ({
    keyIndex: index + 1,
    currentRequestCount: usage.requestCount,
    totalRequests: usage.totalRequests,
    successfulRequests: usage.successfulRequests,
    errorCount: usage.errorCount,
    lastUsed: usage.lastUsed.toISOString(),
    isResting: usage.restUntil !== null && now < usage.restUntil,
    restUntil: usage.restUntil ? usage.restUntil.toISOString() : null,
    timeUntilAvailable:
      usage.restUntil && now < usage.restUntil
        ? Math.ceil((usage.restUntil.getTime() - now.getTime()) / 1000) +
          " seconds"
        : "Available now",
  }));

  return {
    currentKeyIndex: currentKeyIndex + 1,
    totalKeys: OPENROUTER_API_KEYS.length,
    globalStats: {
      ...globalStats,
      uptime: uptimeHours.toFixed(2) + " hours",
      successRate:
        globalStats.totalRequests > 0
          ? (
              (globalStats.successfulRequests / globalStats.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "N/A",
    },
    keyStats,
  };
}
