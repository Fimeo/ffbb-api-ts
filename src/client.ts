import { TokenManager } from './auth.js';
import { DirectusClient } from './directus/index.js';
import { MeilisearchClient } from './meilisearch/index.js';
import { AssetHelper } from './assets.js';
import type { AssetTransforms } from './assets.js';
import type { DirectusQuery } from './types/query.js';
import type {
  Organisme,
  Poule,
  Rencontre,
  Competition,
  Engagement,
  ApiVersion,
  LiveMatch,
  Saison,
} from './types/collections.js';
import type {
  MeilisearchIndex,
  MeilisearchQuery,
  MeilisearchResponse,
  MultiSearchQuery,
  MultiSearchResponse,
} from './types/meilisearch.js';
import type { CollectionName } from './directus/collections.js';
import { FFBBError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.ffbb.com';
const DEFAULT_MEILISEARCH_URL = 'https://meilisearch-prod.ffbb.app';
const DEFAULT_TIMEOUT = 30_000;

/**
 * Options for creating an {@link FFBBClient}.
 */
export interface FFBBClientOptions {
  /** Override the Directus API base URL. Default: `https://api.ffbb.com` */
  baseUrl?: string;
  /** Provide a Directus API token directly instead of auto-fetching. */
  token?: string;
  /** Override the Meilisearch base URL. Default: `https://meilisearch-prod.ffbb.app` */
  meilisearchUrl?: string;
  /** Provide a Meilisearch token directly. */
  meilisearchToken?: string;
  /** Custom fetch implementation (for testing or edge runtimes). */
  fetch?: typeof globalThis.fetch;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
}

/**
 * Main entry point for the FFBB API client.
 *
 * Provides high-level convenience methods for common operations,
 * plus access to the underlying {@link DirectusClient} and {@link MeilisearchClient}
 * for advanced usage.
 *
 * @example
 * ```ts
 * import { FFBBClient } from 'ffbb-api-client';
 *
 * const client = new FFBBClient();
 * await client.authenticate();
 *
 * // Get a club with its engagements
 * const club = await client.getOrganisme('11402', {
 *   fields: ['id', 'nom', 'engagements.id', 'engagements.nom'],
 *   deep: { engagements: { _limit: 100 } },
 * });
 *
 * // Get pool data with matches
 * const poule = await client.getPoule('456', {
 *   fields: ['id', 'nom', 'rencontres.*', 'classements.*'],
 *   deep: { rencontres: { _limit: 1000, _sort: ['date_rencontre'] } },
 * });
 *
 * // Search for clubs
 * const results = await client.search('ffbbserver_organismes', { q: 'Paris', limit: 5 });
 * ```
 */
export class FFBBClient {
  /** Direct access to the Directus REST client for advanced queries. */
  readonly directus: DirectusClient;
  /** Direct access to the Meilisearch client for full-text search. */
  readonly search: MeilisearchClient;
  /** Helper for building asset URLs and downloading files. */
  readonly assets: AssetHelper;

  private readonly tokenManager: TokenManager;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options?: FFBBClientOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = options?.fetch ?? globalThis.fetch.bind(globalThis);

    const meilisearchUrl = options?.meilisearchUrl ?? DEFAULT_MEILISEARCH_URL;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    this.tokenManager = new TokenManager({
      directusToken: options?.token,
      meilisearchToken: options?.meilisearchToken,
    });

    this.directus = new DirectusClient(this.baseUrl, this.tokenManager, this.fetchFn, timeout);
    this.search = new MeilisearchClient(meilisearchUrl, this.tokenManager, this.fetchFn);
    this.assets = new AssetHelper(this.baseUrl, this.fetchFn);
  }

  /**
   * Authenticate by fetching API tokens from the FFBB configuration endpoint.
   *
   * This must be called before making any API requests, unless tokens were
   * provided in the constructor options.
   *
   * @throws {FFBBAuthError} If token fetch fails
   */
  async authenticate(): Promise<void> {
    await this.tokenManager.fetchTokens(this.baseUrl, this.fetchFn);
  }

  // ─── Convenience getters for common collections ────────────────────────────

  /**
   * Get an organism (club/organization) by ID.
   *
   * @param id - The organism ID
   * @param query - Optional query (fields, deep, filter)
   */
  async getOrganisme(id: string, query?: DirectusQuery): Promise<Organisme> {
    return this.directus.get<Organisme>('ffbbserver_organismes', id, query);
  }

  /**
   * Get a pool/group by ID, typically with matches and standings.
   *
   * @param id - The poule ID
   * @param query - Optional query (fields, deep, filter)
   */
  async getPoule(id: string, query?: DirectusQuery): Promise<Poule> {
    return this.directus.get<Poule>('ffbbserver_poules', id, query);
  }

  /**
   * Get a single match/encounter by ID.
   *
   * @param id - The rencontre ID
   * @param query - Optional query (fields, deep)
   */
  async getRencontre(id: string, query?: DirectusQuery): Promise<Rencontre> {
    return this.directus.get<Rencontre>('ffbbserver_rencontres', id, query);
  }

  /**
   * Get a competition by ID.
   *
   * @param id - The competition ID
   * @param query - Optional query (fields, deep)
   */
  async getCompetition(id: string, query?: DirectusQuery): Promise<Competition> {
    return this.directus.get<Competition>('ffbbserver_competitions', id, query);
  }

  /**
   * Get an engagement (team entry in a competition) by ID.
   *
   * @param id - The engagement ID
   * @param query - Optional query (fields, deep)
   */
  async getEngagement(id: string, query?: DirectusQuery): Promise<Engagement> {
    return this.directus.get<Engagement>('ffbbserver_engagements', id, query);
  }

  // ─── Generic collection access ─────────────────────────────────────────────

  /**
   * Get a single item from any Directus collection.
   *
   * @param collection - The collection name (use `COLLECTIONS` constants)
   * @param id - The item ID
   * @param query - Optional query parameters
   */
  async get<T>(collection: CollectionName | string, id: string, query?: DirectusQuery): Promise<T> {
    return this.directus.get<T>(collection, id, query);
  }

  /**
   * List items from any Directus collection.
   *
   * @param collection - The collection name (use `COLLECTIONS` constants)
   * @param query - Optional query parameters (fields, filter, sort, limit, etc.)
   */
  async list<T>(collection: CollectionName | string, query?: DirectusQuery): Promise<T[]> {
    return this.directus.list<T>(collection, query);
  }

  /**
   * Auto-paginate through all items in a collection.
   *
   * @param collection - The collection name
   * @param query - Optional query parameters. `limit` and `offset` are managed automatically.
   * @param pageSize - Items per page (default: 100)
   */
  listAll<T>(
    collection: CollectionName | string,
    query?: DirectusQuery,
    pageSize?: number,
  ): AsyncGenerator<T> {
    return this.directus.listAll<T>(collection, query, pageSize);
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  /**
   * Full-text search on a Meilisearch index.
   *
   * @param index - The Meilisearch index to search
   * @param query - Search query parameters
   */
  async searchIndex<T>(
    index: MeilisearchIndex,
    query: MeilisearchQuery,
  ): Promise<MeilisearchResponse<T>> {
    return this.search.search<T>(index, query);
  }

  /**
   * Multi-index federated search.
   *
   * @param queries - Array of queries targeting specific indexes
   */
  async multiSearch<T>(queries: MultiSearchQuery[]): Promise<MultiSearchResponse<T>> {
    return this.search.multiSearch<T>(queries);
  }

  // ─── Special endpoints ─────────────────────────────────────────────────────

  /**
   * Get the FFBB API version info.
   *
   * @returns The latest API version, or `null` if unavailable
   */
  async getApiVersion(): Promise<ApiVersion | null> {
    try {
      const url = `${this.baseUrl}/json/app_versions.json`;
      const response = await this.fetchFn(url, {
        headers: { Authorization: this.tokenManager.getDirectusAuthHeader() },
      });

      if (!response.ok) return null;

      const versions = (await response.json()) as Array<{ version: string; title: string }>;
      if (Array.isArray(versions) && versions.length > 0) {
        const latest = versions[versions.length - 1];
        return { version: latest.version, title: latest.title };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get currently live matches.
   *
   * @returns Array of live match data, or empty array if unavailable
   */
  async getLives(): Promise<LiveMatch[]> {
    try {
      const url = `${this.baseUrl}/json/lives.json`;
      const response = await this.fetchFn(url, {
        headers: { Authorization: this.tokenManager.getDirectusAuthHeader() },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Get active seasons.
   *
   * @param query - Optional query parameters
   */
  async getSaisons(query?: DirectusQuery): Promise<Saison[]> {
    return this.directus.list<Saison>('ffbbserver_saisons', query);
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  /**
   * Build a URL for an asset (logo, image) with optional transforms.
   *
   * @param uuid - The asset UUID
   * @param transforms - Optional image transformations (width, height, format, etc.)
   * @returns The full asset URL
   */
  assetUrl(uuid: string, transforms?: AssetTransforms): string {
    return this.assets.url(uuid, transforms);
  }

  /**
   * Download an asset as raw bytes.
   *
   * @param uuid - The asset UUID
   * @param transforms - Optional image transformations
   * @returns The file data as an ArrayBuffer
   */
  async downloadAsset(uuid: string, transforms?: AssetTransforms): Promise<ArrayBuffer> {
    return this.assets.download(uuid, transforms);
  }
}
