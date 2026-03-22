import { describe, it, expect } from 'vitest';
import { buildSearchBody, buildGeoSort, buildGeoFilter } from '../../src/meilisearch/query-builder.js';
import { GeoSortOrder } from '../../src/types/meilisearch.js';

describe('buildSearchBody', () => {
  it('returns empty object for empty query', () => {
    expect(buildSearchBody({})).toEqual({});
  });

  it('includes q when provided', () => {
    expect(buildSearchBody({ q: 'Paris' })).toEqual({ q: 'Paris' });
  });

  it('includes all search parameters', () => {
    const result = buildSearchBody({
      q: 'basketball',
      limit: 10,
      offset: 5,
      filter: "commune.libelle = 'Paris'",
      facets: ['commune.libelle', 'niveau_code'],
      sort: ['nom:asc'],
      attributesToRetrieve: ['id', 'nom'],
      attributesToHighlight: ['nom'],
    });

    expect(result).toEqual({
      q: 'basketball',
      limit: 10,
      offset: 5,
      filter: "commune.libelle = 'Paris'",
      facets: ['commune.libelle', 'niveau_code'],
      sort: ['nom:asc'],
      attributesToRetrieve: ['id', 'nom'],
      attributesToHighlight: ['nom'],
    });
  });

  it('omits undefined values', () => {
    const result = buildSearchBody({ q: 'test', limit: undefined });
    expect(result).toEqual({ q: 'test' });
    expect('limit' in result).toBe(false);
  });

  it('supports array filter syntax', () => {
    const result = buildSearchBody({
      filter: ['level = "N1"', 'sexe = "M"'],
    });
    expect(result.filter).toEqual(['level = "N1"', 'sexe = "M"']);
  });
});

describe('buildGeoSort', () => {
  it('builds ascending geo sort (nearest first)', () => {
    expect(buildGeoSort(48.8566, 2.3522)).toBe('_geoPoint(48.8566, 2.3522):asc');
  });

  it('builds descending geo sort (farthest first)', () => {
    expect(buildGeoSort(48.8566, 2.3522, GeoSortOrder.FARTHEST_FIRST)).toBe(
      '_geoPoint(48.8566, 2.3522):desc',
    );
  });
});

describe('buildGeoFilter', () => {
  it('builds geo radius filter in meters', () => {
    expect(buildGeoFilter(48.8566, 2.3522, 50)).toBe('_geoRadius(48.8566, 2.3522, 50000)');
  });

  it('rounds meters to integer', () => {
    expect(buildGeoFilter(0, 0, 1.5)).toBe('_geoRadius(0, 0, 1500)');
  });
});
