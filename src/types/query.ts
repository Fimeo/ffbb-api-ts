/**
 * Directus filter operators.
 *
 * Filters can be nested for relational fields:
 * ```ts
 * { saison: { id: { _eq: '1036' } } }
 * ```
 *
 * Supported operators: _eq, _neq, _lt, _lte, _gt, _gte, _in, _nin,
 * _contains, _icontains, _ncontains, _starts_with, _nstarts_with,
 * _ends_with, _nends_with, _between, _nbetween, _null, _nnull, _empty, _nempty
 */
export type DirectusFilter = {
  [key: string]: unknown;
};

/**
 * Configuration for deep relation expansion.
 *
 * Allows limiting, filtering, and sorting nested relations.
 *
 * ```ts
 * deep: {
 *   rencontres: {
 *     _limit: 1000,
 *     _filter: { saison: { actif: { _eq: true } } },
 *     _sort: ['date_rencontre'],
 *   }
 * }
 * ```
 */
export interface DeepConfig {
  _limit?: number;
  _offset?: number;
  _sort?: string[];
  _filter?: DirectusFilter;
}

/**
 * Query parameters for Directus REST API requests.
 *
 * @example
 * ```ts
 * const query: DirectusQuery = {
 *   fields: ['id', 'nom', 'engagements.id', 'engagements.idCompetition.nom'],
 *   filter: { typeCompetition: { _eq: 'DIV' } },
 *   deep: {
 *     engagements: { _limit: 1000 }
 *   },
 *   sort: ['-date_rencontre'],
 *   limit: 100,
 * };
 * ```
 */
export interface DirectusQuery {
  /** Fields to include. Supports dot-notation for relations (e.g. `'engagements.idCompetition.nom'`). */
  fields?: string[];
  /** Filter criteria using Directus filter operators. */
  filter?: DirectusFilter;
  /** Deep relation expansion configuration. Keys are relation names. */
  deep?: Record<string, DeepConfig>;
  /** Sort fields. Prefix with `-` for descending (e.g. `'-date_rencontre'`). */
  sort?: string[];
  /** Maximum number of items to return. */
  limit?: number;
  /** Number of items to skip (for pagination). */
  offset?: number;
  /** Full-text search term. */
  search?: string;
}

/**
 * Directus API response wrapper.
 */
export interface DirectusResponse<T> {
  data: T;
}
