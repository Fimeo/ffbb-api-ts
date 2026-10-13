import type { Configuration } from './types/collections.js';
import type { DirectusResponse } from './types/query.js';
import { FFBBAuthError, FFBBNetworkError, FFBBRequestError } from './errors.js';
import { EndpointPool } from './endpoints.js';

/**
 * Manages API tokens for the FFBB Directus and Meilisearch APIs.
 *
 * Tokens can be provided manually or fetched automatically from the
 * FFBB configuration endpoint.
 *
 * @example
 * ```ts
 * // Auto-fetch tokens
 * const manager = new TokenManager();
 * await manager.fetchTokens(['https://bo.ffbb.com', 'https://bo.ffbb.app'], fetch);
 *
 * // Manual tokens
 * const manager = new TokenManager({
 *   directusToken: 'my-directus-token',
 *   meilisearchToken: 'my-meilisearch-token',
 * });
 * ```
 */
export class TokenManager {
  directusToken: string | null;
  meilisearchToken: string | null;

  constructor(options?: { directusToken?: string; meilisearchToken?: string }) {
    this.directusToken = options?.directusToken ?? null;
    this.meilisearchToken = options?.meilisearchToken ?? null;
  }

  /**
   * Fetch both API tokens from the FFBB configuration endpoint.
   *
   * When several base URLs are given, the next one is tried on network error or HTTP 5xx.
   *
   * @param baseUrl - The API base URL (e.g. `https://bo.ffbb.com`), an ordered list of
   *   fallback base URLs, or a shared {@link EndpointPool}
   * @param fetchFn - The fetch implementation to use
   * @throws {FFBBAuthError} If the token fetch fails or tokens are missing from the response
   */
  async fetchTokens(
    baseUrl: string | readonly string[] | EndpointPool,
    fetchFn: typeof fetch,
  ): Promise<void> {
    const endpoints = baseUrl instanceof EndpointPool ? baseUrl : new EndpointPool(baseUrl);

    let response: Response;
    try {
      response = await endpoints.run(async (base) => {
        const url = `${base}/items/configuration`;
        let res: Response;
        try {
          res = await fetchFn(url);
        } catch (error) {
          throw new FFBBNetworkError(url, { cause: error });
        }
        if (!res.ok) {
          throw new FFBBRequestError(`HTTP ${res.status} ${res.statusText} for ${url}`, {
            status: res.status,
            statusText: res.statusText,
            url,
          });
        }
        return res;
      });
    } catch (error) {
      if (error instanceof FFBBRequestError) {
        throw new FFBBAuthError(
          `Configuration endpoint returned HTTP ${error.status}: ${error.statusText}`,
          { cause: error },
        );
      }
      throw new FFBBAuthError('Failed to fetch API tokens from configuration endpoint', {
        cause: error,
      });
    }

    let body: DirectusResponse<Configuration>;
    try {
      body = (await response.json()) as DirectusResponse<Configuration>;
    } catch (error) {
      throw new FFBBAuthError('Failed to parse configuration response as JSON', { cause: error });
    }

    if (!body.data?.key_dh) {
      throw new FFBBAuthError('Directus API token (key_dh) not found in configuration response');
    }

    this.directusToken = body.data.key_dh;
    this.meilisearchToken = body.data.key_ms ?? null;
  }

  /**
   * Get the `Authorization` header value for the Directus API.
   *
   * @throws {FFBBAuthError} If no Directus token is available
   */
  getDirectusAuthHeader(): string {
    if (!this.directusToken) {
      throw new FFBBAuthError(
        'No Directus API token available. Call authenticate() or provide a token.',
      );
    }
    return `Bearer ${this.directusToken}`;
  }

  /**
   * Get the `Authorization` header value for the Meilisearch API.
   *
   * @throws {FFBBAuthError} If no Meilisearch token is available
   */
  getMeilisearchAuthHeader(): string {
    if (!this.meilisearchToken) {
      throw new FFBBAuthError(
        'No Meilisearch API token available. Call authenticate() or provide a token.',
      );
    }
    return `Bearer ${this.meilisearchToken}`;
  }

  /** Whether a Directus token is currently available. */
  get isAuthenticated(): boolean {
    return this.directusToken !== null;
  }

  /** Whether a Meilisearch token is currently available. */
  get hasMeilisearchToken(): boolean {
    return this.meilisearchToken !== null;
  }
}
