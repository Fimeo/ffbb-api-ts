// ─── Main client ─────────────────────────────────────────────────────────────
export { FFBBClient } from './client.js';
export type { FFBBClientOptions } from './client.js';

// ─── Sub-clients ─────────────────────────────────────────────────────────────
export { DirectusClient } from './directus/index.js';
export { MeilisearchClient } from './meilisearch/index.js';

// ─── Auth ────────────────────────────────────────────────────────────────────
export { TokenManager } from './auth.js';

// ─── Assets ──────────────────────────────────────────────────────────────────
export { AssetHelper } from './assets.js';
export type { AssetTransforms } from './assets.js';

// ─── Query builders ──────────────────────────────────────────────────────────
export { buildQueryString } from './directus/query-builder.js';
export { buildSearchBody, buildGeoSort, buildGeoFilter } from './meilisearch/query-builder.js';

// ─── Collection constants ────────────────────────────────────────────────────
export { COLLECTIONS } from './directus/collections.js';
export type { CollectionName } from './directus/collections.js';

// ─── Errors ──────────────────────────────────────────────────────────────────
export { FFBBError, FFBBAuthError, FFBBRequestError, FFBBTimeoutError } from './errors.js';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Collections
  Configuration,
  Logo,
  Organisme,
  Saison,
  Competition,
  Engagement,
  Salle,
  Rencontre,
  Classement,
  Poule,
  Terrain,
  Tournoi,
  Entraineur,
  Formation,
  Commune,
  Officiel,
  Pratique,
  ApiVersion,
  LiveMatch,
  // Query
  DirectusFilter,
  DeepConfig,
  DirectusQuery,
  DirectusResponse,
  // Meilisearch
  MeilisearchIndex,
  MeilisearchQuery,
  MeilisearchHit,
  MeilisearchResponse,
  MultiSearchQuery,
  MultiSearchResultEntry,
  MultiSearchResponse,
} from './types/index.js';

export { GeoSortOrder } from './types/index.js';
