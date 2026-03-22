import type {
  MeilisearchIndex,
  MeilisearchQuery,
  MeilisearchResponse,
  MultiSearchQuery,
  MultiSearchResponse,
} from '../types/meilisearch.js';
import type { TokenManager } from '../auth.js';
import { FFBBRequestError, FFBBAuthError, FFBBError } from '../errors.js';
import { buildSearchBody } from './query-builder.js';

/**
 * Client for the FFBB Meilisearch full-text search API.
 *
 * @example
 * ```ts
 * const search = new MeilisearchClient('https://meilisearch-prod.ffbb.app', tokenManager, fetch);
 *
 * const results = await search.search<Organisme>('ffbbserver_organismes', {
 *   q: 'Paris',
 *   limit: 5,
 * });
 *
 * for (const hit of results.hits) {
 *   console.log(hit.nom);
 * }
 * ```
 */
export class MeilisearchClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenManager: TokenManager,
    private readonly fetchFn: typeof fetch,
  ) {}

  /**
   * Search a single Meilisearch index.
   *
   * @param index - The index to search
   * @param query - Search query parameters
   * @returns Search results with hits and metadata
   */
  async search<T>(
    index: MeilisearchIndex,
    query: MeilisearchQuery,
  ): Promise<MeilisearchResponse<T>> {
    const url = `${this.baseUrl}/indexes/${index}/search`;
    return this.post<MeilisearchResponse<T>>(url, buildSearchBody(query));
  }

  /**
   * Perform a multi-index federated search.
   *
   * @param queries - Array of queries, each targeting a specific index
   * @returns Combined results from all searched indexes
   */
  async multiSearch<T>(queries: MultiSearchQuery[]): Promise<MultiSearchResponse<T>> {
    const url = `${this.baseUrl}/multi-search`;
    const body = {
      queries: queries.map((q) => {
        const { indexUid, ...rest } = q;
        return { indexUid, ...buildSearchBody(rest) };
      }),
    };
    return this.post<MultiSearchResponse<T>>(url, body);
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: this.tokenManager.getMeilisearchAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new FFBBError(`Network error requesting ${url}`, { cause: error });
    }

    if (response.status === 401 || response.status === 403) {
      throw new FFBBAuthError(
        `Meilisearch authentication failed: HTTP ${response.status} ${response.statusText}`,
      );
    }

    if (!response.ok) {
      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = undefined;
      }
      throw new FFBBRequestError(`HTTP ${response.status} ${response.statusText} for ${url}`, {
        status: response.status,
        statusText: response.statusText,
        url,
        body: responseBody,
      });
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new FFBBError(`Failed to parse Meilisearch JSON response from ${url}`, {
        cause: error,
      });
    }
  }
}
