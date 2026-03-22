/**
 * Available Meilisearch index names for the FFBB API.
 */
export type MeilisearchIndex =
  | 'ffbbserver_organismes'
  | 'ffbbserver_rencontres'
  | 'ffbbserver_terrains'
  | 'ffbbserver_salles'
  | 'ffbbserver_tournois'
  | 'ffbbserver_competitions'
  | 'ffbbserver_engagements'
  | 'ffbbserver_formations'
  | 'ffbbnational_pratiques';

/**
 * Query parameters for a Meilisearch search request.
 */
export interface MeilisearchQuery {
  /** The search query string. */
  q?: string;
  /** Maximum number of results to return. Default: 20. */
  limit?: number;
  /** Number of results to skip. */
  offset?: number;
  /** Filter expression (e.g. `"commune.libelle = 'Paris' AND niveau_code = 'N1'"`). */
  filter?: string | string[];
  /** Facets to retrieve distribution for. */
  facets?: string[];
  /** Sort criteria (e.g. `['nom:asc']` or `['_geoPoint(lat, lng):asc']`). */
  sort?: string[];
  /** Attributes to retrieve. */
  attributesToRetrieve?: string[];
  /** Attributes to highlight. */
  attributesToHighlight?: string[];
}

/**
 * A single search hit from Meilisearch.
 */
export interface MeilisearchHit<T> {
  /** The matched document. */
  document: T;
  /** Highlighted fields (if requested). */
  _formatted?: Partial<Record<string, string>>;
}

/**
 * Response from a single-index Meilisearch search.
 */
export interface MeilisearchResponse<T> {
  /** The matched documents. */
  hits: T[];
  /** Total number of estimated matches. */
  estimatedTotalHits?: number;
  /** Processing time in milliseconds. */
  processingTimeMs: number;
  /** The original query. */
  query: string;
  /** Facet distribution (if facets were requested). */
  facetDistribution?: Record<string, Record<string, number>>;
  /** Facet statistics (if applicable). */
  facetStats?: Record<string, { min: number; max: number }>;
}

/**
 * A query within a multi-search request.
 */
export interface MultiSearchQuery extends MeilisearchQuery {
  /** The index to search in. */
  indexUid: MeilisearchIndex;
}

/**
 * Result entry from a multi-search response.
 */
export interface MultiSearchResultEntry<T> {
  indexUid: string;
  hits: T[];
  estimatedTotalHits?: number;
  processingTimeMs: number;
  query: string;
  facetDistribution?: Record<string, Record<string, number>>;
}

/**
 * Response from a multi-index search.
 */
export interface MultiSearchResponse<T> {
  results: MultiSearchResultEntry<T>[];
}

/**
 * Geographic sort order for proximity searches.
 */
export enum GeoSortOrder {
  NEAREST_FIRST = 'asc',
  FARTHEST_FIRST = 'desc',
}
