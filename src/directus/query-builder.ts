import type { DirectusQuery, DirectusFilter, DeepConfig } from '../types/query.js';

/**
 * Serialize a nested filter object into Directus bracket-notation query parameters.
 *
 * Example: `{ saison: { actif: { _eq: true } } }`
 * becomes: `[saison][actif][_eq]=true`
 *
 * @param filter - The filter object
 * @param prefix - Current bracket prefix (used in recursion)
 * @returns Array of `key=value` strings (not yet URI-encoded for the key path)
 */
function serializeFilter(filter: DirectusFilter, prefix: string): string[] {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(filter)) {
    const path = `${prefix}[${key}]`;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      parts.push(...serializeFilter(value as DirectusFilter, path));
    } else if (Array.isArray(value)) {
      // Arrays are serialized as comma-separated values for operators like _in
      parts.push(`${path}=${encodeURIComponent(value.join(','))}`);
    } else {
      parts.push(`${path}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts;
}

/**
 * Serialize a DeepConfig object into Directus bracket-notation query parameters.
 *
 * Example: `deep: { rencontres: { _limit: 1000, _filter: { saison: { actif: true } }, _sort: ['date'] } }`
 * becomes:
 *   `deep[rencontres][_limit]=1000`
 *   `deep[rencontres][_filter][saison][actif]=true`
 *   `deep[rencontres][_sort][]=date`
 */
function serializeDeep(deep: Record<string, DeepConfig>): string[] {
  const parts: string[] = [];

  for (const [relation, config] of Object.entries(deep)) {
    const prefix = `deep[${relation}]`;

    if (config._limit !== undefined) {
      parts.push(`${prefix}[_limit]=${config._limit}`);
    }

    if (config._offset !== undefined) {
      parts.push(`${prefix}[_offset]=${config._offset}`);
    }

    if (config._sort) {
      for (const field of config._sort) {
        parts.push(`${prefix}[_sort][]=${encodeURIComponent(field)}`);
      }
    }

    if (config._filter) {
      parts.push(...serializeFilter(config._filter, `${prefix}[_filter]`));
    }
  }

  return parts;
}

/**
 * Convert a {@link DirectusQuery} object into a URL query string.
 *
 * @param query - The query parameters to serialize
 * @returns URL query string (without leading `?`)
 *
 * @example
 * ```ts
 * const qs = buildQueryString({
 *   fields: ['id', 'nom', 'engagements.id'],
 *   deep: {
 *     engagements: { _limit: 1000 }
 *   },
 *   limit: 50,
 * });
 * // "fields[]=id&fields[]=nom&fields[]=engagements.id&deep[engagements][_limit]=1000&limit=50"
 * ```
 */
export function buildQueryString(query: DirectusQuery): string {
  const parts: string[] = [];

  // Fields
  if (query.fields && query.fields.length > 0) {
    for (const field of query.fields) {
      parts.push(`fields[]=${encodeURIComponent(field)}`);
    }
  }

  // Filter
  if (query.filter) {
    parts.push(...serializeFilter(query.filter, 'filter'));
  }

  // Deep
  if (query.deep) {
    parts.push(...serializeDeep(query.deep));
  }

  // Sort
  if (query.sort && query.sort.length > 0) {
    for (const field of query.sort) {
      parts.push(`sort[]=${encodeURIComponent(field)}`);
    }
  }

  // Limit
  if (query.limit !== undefined) {
    parts.push(`limit=${query.limit}`);
  }

  // Offset
  if (query.offset !== undefined) {
    parts.push(`offset=${query.offset}`);
  }

  // Search
  if (query.search) {
    parts.push(`search=${encodeURIComponent(query.search)}`);
  }

  return parts.join('&');
}
