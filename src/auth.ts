import type { Configuration } from './types/collections.js';
import type { DirectusResponse } from './types/query.js';
import { FFBBAuthError } from './errors.js';

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
 * await manager.fetchTokens('https://api.ffbb.com', fetch);
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
   * @param baseUrl - The API base URL (e.g. `https://api.ffbb.com`)
   * @param fetchFn - The fetch implementation to use
   * @throws {FFBBAuthError} If the token fetch fails or tokens are missing from the response
   */
  async fetchTokens(baseUrl: string, fetchFn: typeof fetch): Promise<void> {
    const url = `${baseUrl}/items/configuration`;

    let response: Response;
    try {
      response = await fetchFn(url);
    } catch (error) {
      throw new FFBBAuthError('Failed to fetch API tokens from configuration endpoint', {
        cause: error,
      });
    }

    if (!response.ok) {
      throw new FFBBAuthError(
        `Configuration endpoint returned HTTP ${response.status}: ${response.statusText}`,
      );
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
