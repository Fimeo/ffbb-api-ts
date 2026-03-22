import type { MeilisearchQuery } from '../types/meilisearch.js';
import { GeoSortOrder } from '../types/meilisearch.js';

/**
 * Build the JSON body for a Meilisearch search request.
 *
 * @param query - The search query parameters
 * @returns The serialized JSON body object
 */
export function buildSearchBody(query: MeilisearchQuery): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (query.q !== undefined) body.q = query.q;
  if (query.limit !== undefined) body.limit = query.limit;
  if (query.offset !== undefined) body.offset = query.offset;
  if (query.filter !== undefined) body.filter = query.filter;
  if (query.facets !== undefined) body.facets = query.facets;
  if (query.sort !== undefined) body.sort = query.sort;
  if (query.attributesToRetrieve !== undefined)
    body.attributesToRetrieve = query.attributesToRetrieve;
  if (query.attributesToHighlight !== undefined)
    body.attributesToHighlight = query.attributesToHighlight;

  return body;
}

/**
 * Build a geo-distance sort expression for Meilisearch.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param order - Sort order (nearest first or farthest first)
 * @returns Sort expression string (e.g. `_geoPoint(48.8566, 2.3522):asc`)
 */
export function buildGeoSort(lat: number, lng: number, order: GeoSortOrder = GeoSortOrder.NEAREST_FIRST): string {
  return `_geoPoint(${lat}, ${lng}):${order}`;
}

/**
 * Build a geo-radius filter expression for Meilisearch.
 *
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Filter expression string (e.g. `_geoRadius(48.8566, 2.3522, 50000)`)
 */
export function buildGeoFilter(lat: number, lng: number, radiusKm: number): string {
  const radiusMeters = Math.round(radiusKm * 1000);
  return `_geoRadius(${lat}, ${lng}, ${radiusMeters})`;
}
