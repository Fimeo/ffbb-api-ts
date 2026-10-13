import { FFBBNetworkError, FFBBRequestError, FFBBTimeoutError } from './errors.js';

/**
 * Ordered list of base URLs for the same API, with automatic fallback.
 *
 * Requests go to the active URL first (initially the first one). When a request
 * fails with a recoverable error, the next URLs are tried in order. The URL that
 * succeeds becomes the active one for subsequent requests.
 *
 * @example
 * ```ts
 * const pool = new EndpointPool(['https://bo.ffbb.com', 'https://bo.ffbb.app']);
 * const data = await pool.run((baseUrl) => fetchJson(`${baseUrl}/items/configuration`));
 * ```
 */
export class EndpointPool {
  readonly urls: readonly string[];
  private activeIndex = 0;

  constructor(urls: string | readonly string[]) {
    const list = (typeof urls === 'string' ? [urls] : [...urls]).map((url) =>
      url.replace(/\/+$/, ''),
    );
    if (list.length === 0) {
      throw new Error('EndpointPool requires at least one base URL');
    }
    this.urls = list;
  }

  /** The base URL currently used first. */
  get current(): string {
    return this.urls[this.activeIndex];
  }

  /**
   * Run an operation against each base URL until one succeeds.
   *
   * @param attempt - The operation to run for a given base URL
   * @param canFallback - Whether an error should trigger a retry on the next URL.
   *   Defaults to {@link isRecoverableError}.
   * @throws The error of the last attempt if every URL failed, or the first non-recoverable error
   */
  async run<T>(
    attempt: (baseUrl: string) => Promise<T>,
    canFallback: (error: unknown) => boolean = isRecoverableError,
  ): Promise<T> {
    let lastError: unknown;

    for (const index of this.attemptOrder()) {
      try {
        const result = await attempt(this.urls[index]);
        this.activeIndex = index;
        return result;
      } catch (error) {
        if (!canFallback(error)) throw error;
        lastError = error;
      }
    }

    throw lastError;
  }

  private attemptOrder(): number[] {
    const others = this.urls.map((_, i) => i).filter((i) => i !== this.activeIndex);
    return [this.activeIndex, ...others];
  }
}

/**
 * Whether an error means the host is unavailable and another base URL should be tried:
 * network error, timeout or HTTP 5xx.
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof FFBBNetworkError || error instanceof FFBBTimeoutError) return true;
  return error instanceof FFBBRequestError && error.status >= 500;
}
