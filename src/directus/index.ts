import type { DirectusQuery, DirectusResponse } from '../types/query.js';
import type { TokenManager } from '../auth.js';
import { FFBBRequestError, FFBBAuthError, FFBBTimeoutError, FFBBError } from '../errors.js';
import { buildQueryString } from './query-builder.js';

const DEFAULT_PAGE_SIZE = 100;

/**
 * Low-level client for the FFBB Directus REST API.
 *
 * Handles request construction, authentication headers, error mapping,
 * and pagination.
 *
 * @example
 * ```ts
 * const directus = new DirectusClient('https://api.ffbb.com', tokenManager, fetch);
 * const poule = await directus.get<Poule>('ffbbserver_poules', '123', {
 *   fields: ['id', 'nom', 'rencontres.*'],
 * });
 * ```
 */
export class DirectusClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenManager: TokenManager,
    private readonly fetchFn: typeof fetch,
    private readonly timeout: number = 30_000,
  ) {}

  /**
   * Fetch a single item from a collection by ID.
   *
   * @param collection - The Directus collection name
   * @param id - The item ID
   * @param query - Optional query parameters (fields, deep, etc.)
   * @returns The item data (unwrapped from Directus `{ data: ... }` envelope)
   */
  async get<T>(collection: string, id: string, query?: DirectusQuery): Promise<T> {
    const qs = query ? buildQueryString(query) : '';
    const path = `/items/${collection}/${id}${qs ? `?${qs}` : ''}`;
    const response = await this.request<DirectusResponse<T>>(path);
    return response.data;
  }

  /**
   * Fetch a list of items from a collection.
   *
   * @param collection - The Directus collection name
   * @param query - Optional query parameters (fields, filter, limit, etc.)
   * @returns Array of items (unwrapped from Directus `{ data: ... }` envelope)
   */
  async list<T>(collection: string, query?: DirectusQuery): Promise<T[]> {
    const qs = query ? buildQueryString(query) : '';
    const path = `/items/${collection}${qs ? `?${qs}` : ''}`;
    const response = await this.request<DirectusResponse<T[]>>(path);
    return response.data;
  }

  /**
   * Auto-paginate through all items in a collection.
   *
   * Returns an async generator that yields items page by page.
   *
   * @param collection - The Directus collection name
   * @param query - Optional query parameters (fields, filter, sort, etc.). `limit` and `offset` are managed automatically.
   * @param pageSize - Items per page (default: 100)
   *
   * @example
   * ```ts
   * for await (const item of directus.listAll<Rencontre>('ffbbserver_rencontres', {
   *   filter: { joue: { _eq: true } },
   *   fields: ['id', 'nomEquipe1', 'nomEquipe2'],
   * })) {
   *   console.log(item.nomEquipe1, 'vs', item.nomEquipe2);
   * }
   * ```
   */
  async *listAll<T>(
    collection: string,
    query?: DirectusQuery,
    pageSize: number = DEFAULT_PAGE_SIZE,
  ): AsyncGenerator<T> {
    let offset = 0;

    while (true) {
      const pageQuery: DirectusQuery = {
        ...query,
        limit: pageSize,
        offset,
      };

      const items = await this.list<T>(collection, pageQuery);

      for (const item of items) {
        yield item;
      }

      if (items.length < pageSize) {
        break;
      }

      offset += pageSize;
    }
  }

  /**
   * Execute a raw GET request against the Directus API.
   *
   * @param path - The request path (e.g. `/items/ffbbserver_poules/123?fields[]=id`)
   * @returns Parsed JSON response
   */
  async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      let response: Response;
      try {
        response = await this.fetchFn(url, {
          method: 'GET',
          headers: {
            Authorization: this.tokenManager.getDirectusAuthHeader(),
          },
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new FFBBTimeoutError(url, this.timeout);
        }
        throw new FFBBError(`Network error requesting ${url}`, { cause: error });
      }

      if (response.status === 401 || response.status === 403) {
        throw new FFBBAuthError(
          `Authentication failed: HTTP ${response.status} ${response.statusText} for ${url}`,
        );
      }

      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = undefined;
        }
        throw new FFBBRequestError(
          `HTTP ${response.status} ${response.statusText} for ${url}`,
          {
            status: response.status,
            statusText: response.statusText,
            url,
            body,
          },
        );
      }

      try {
        return (await response.json()) as T;
      } catch (error) {
        throw new FFBBError(`Failed to parse JSON response from ${url}`, { cause: error });
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
