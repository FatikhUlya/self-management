/**
 * Gemini API helper with fallback models and retry logic.
 * 
 * Strategy:
 * 1. Try the primary model (gemini-3.6-flash)
 * 2. If it fails (unavailable / high demand / 429 / 503), retry up to MAX_RETRIES
 *    with exponential backoff
 * 3. If primary model is exhausted, automatically fall through to the next
 *    fallback model and repeat
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Ordered by preference – first available wins
const MODEL_CANDIDATES = [
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.0-flash',
];

const MAX_RETRIES = 2;          // per model
const INITIAL_BACKOFF_MS = 1000; // 1 s → 2 s → 4 s

interface GeminiRequestBody {
  contents: any[];
  generationConfig?: Record<string, any>;
}

interface GeminiSuccess {
  ok: true;
  data: any;
  model: string;
}

interface GeminiFailure {
  ok: false;
  status: number;
  message: string;
}

export type GeminiResult = GeminiSuccess | GeminiFailure;

/**
 * Returns true for status codes that are worth retrying
 * (rate-limit, overloaded, bad gateway, service unavailable, gateway timeout).
 */
function isRetryableStatus(status: number): boolean {
  return [429, 500, 502, 503, 504].includes(status);
}

/**
 * Returns true when the error body indicates the model itself is
 * unavailable / deprecated — in that case we should skip to the next model
 * instead of retrying the same one.
 */
function isModelUnavailable(errorBody: string): boolean {
  const lower = errorBody.toLowerCase();
  return (
    lower.includes('no longer available') ||
    lower.includes('is not found') ||
    lower.includes('not supported') ||
    lower.includes('model not found') ||
    lower.includes('please update your code')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call the Gemini generateContent endpoint with automatic model fallback
 * and retry-with-backoff on transient errors.
 */
export async function callGemini(
  apiKey: string,
  requestBody: GeminiRequestBody,
  tag = 'gemini',
): Promise<GeminiResult> {
  for (const model of MODEL_CANDIDATES) {
    let lastStatus = 0;
    let lastMessage = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(`[${tag}] Retry #${attempt} for ${model} in ${delayMs}ms…`);
        await sleep(delayMs);
      }

      const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

      try {
        console.log(`[${tag}] Calling model=${model} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[${tag}] Success with model=${model}`);
          return { ok: true, data, model };
        }

        // ── Non-OK response ──
        const errorText = await response.text();
        lastStatus = response.status;

        // Try to extract a user-friendly message
        try {
          const parsed = JSON.parse(errorText);
          lastMessage = parsed?.error?.message || errorText;
        } catch {
          lastMessage = errorText;
        }

        console.warn(
          `[${tag}] model=${model} returned ${response.status}: ${lastMessage.slice(0, 200)}`
        );

        // If the *model itself* is deprecated/gone, skip retries and go to next model
        if (isModelUnavailable(errorText)) {
          console.warn(`[${tag}] Model ${model} is unavailable, trying next fallback…`);
          break; // exit retry loop → next model
        }

        // If it's NOT a retryable status, don't retry — but still try next model
        if (!isRetryableStatus(response.status)) {
          break;
        }
      } catch (fetchErr: any) {
        // Network-level error (DNS, timeout, etc.)
        lastStatus = 0;
        lastMessage = fetchErr.message || 'Network error';
        console.error(`[${tag}] Fetch error for ${model}:`, lastMessage);
        // Worth retrying on network errors
      }
    }

    // Exhausted retries for this model – continue to next model
    console.warn(`[${tag}] Exhausted retries for ${model} (last status=${lastStatus})`);
  }

  // All models exhausted
  return {
    ok: false,
    status: 503,
    message:
      'Semua model AI sedang tidak tersedia atau mengalami high demand. Silakan coba lagi dalam beberapa menit.',
  };
}
