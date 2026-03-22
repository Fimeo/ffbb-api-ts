import { describe, it, expect } from 'vitest';
import { buildQueryString } from '../../src/directus/query-builder.js';

describe('buildQueryString', () => {
  it('returns empty string for empty query', () => {
    expect(buildQueryString({})).toBe('');
  });

  // ─── Fields ──────────────────────────────────────────────────────────────

  it('serializes simple fields', () => {
    const result = buildQueryString({ fields: ['id', 'nom'] });
    expect(result).toBe('fields[]=id&fields[]=nom');
  });

  it('serializes dot-notation relational fields', () => {
    const result = buildQueryString({
      fields: ['engagements.id', 'engagements.idCompetition.nom'],
    });
    expect(result).toBe(
      'fields[]=engagements.id&fields[]=engagements.idCompetition.nom',
    );
  });

  it('serializes wildcard fields', () => {
    const result = buildQueryString({ fields: ['classements.*'] });
    expect(result).toBe('fields[]=classements.*');
  });

  it('handles empty fields array', () => {
    expect(buildQueryString({ fields: [] })).toBe('');
  });

  // ─── Filters ─────────────────────────────────────────────────────────────

  it('serializes simple filter with _eq operator', () => {
    const result = buildQueryString({
      filter: { typeCompetition: { _eq: 'DIV' } },
    });
    expect(result).toBe('filter[typeCompetition][_eq]=DIV');
  });

  it('serializes nested relational filter', () => {
    const result = buildQueryString({
      filter: { saison: { id: { _eq: '1036' } } },
    });
    expect(result).toBe('filter[saison][id][_eq]=1036');
  });

  it('serializes boolean filter values', () => {
    const result = buildQueryString({
      filter: { joue: { _eq: true } },
    });
    expect(result).toBe('filter[joue][_eq]=true');
  });

  it('serializes filter with _in operator (array value)', () => {
    const result = buildQueryString({
      filter: { id: { _in: ['1', '2', '3'] } },
    });
    expect(result).toBe('filter[id][_in]=1%2C2%2C3');
  });

  it('serializes deeply nested relational filter', () => {
    const result = buildQueryString({
      filter: { idCompetition: { saison: { id: { _eq: '1036' } } } },
    });
    expect(result).toBe('filter[idCompetition][saison][id][_eq]=1036');
  });

  // ─── Deep ────────────────────────────────────────────────────────────────

  it('serializes deep _limit', () => {
    const result = buildQueryString({
      deep: { rencontres: { _limit: 1000 } },
    });
    expect(result).toBe('deep[rencontres][_limit]=1000');
  });

  it('serializes deep _sort', () => {
    const result = buildQueryString({
      deep: { rencontres: { _sort: ['date_rencontre'] } },
    });
    expect(result).toBe('deep[rencontres][_sort][]=date_rencontre');
  });

  it('serializes deep _filter', () => {
    const result = buildQueryString({
      deep: {
        rencontres: {
          _filter: { saison: { actif: { _eq: true } } },
        },
      },
    });
    expect(result).toBe('deep[rencontres][_filter][saison][actif][_eq]=true');
  });

  it('serializes deep with multiple options', () => {
    const result = buildQueryString({
      deep: {
        rencontres: {
          _limit: 1000,
          _filter: { saison: { actif: { _eq: true } } },
          _sort: ['date_rencontre'],
        },
      },
    });
    expect(result).toContain('deep[rencontres][_limit]=1000');
    expect(result).toContain('deep[rencontres][_sort][]=date_rencontre');
    expect(result).toContain('deep[rencontres][_filter][saison][actif][_eq]=true');
  });

  it('serializes deep _offset', () => {
    const result = buildQueryString({
      deep: { rencontres: { _offset: 50 } },
    });
    expect(result).toBe('deep[rencontres][_offset]=50');
  });

  it('serializes multiple deep relations', () => {
    const result = buildQueryString({
      deep: {
        engagements: { _limit: 1000 },
        rencontres: { _limit: 500 },
      },
    });
    expect(result).toContain('deep[engagements][_limit]=1000');
    expect(result).toContain('deep[rencontres][_limit]=500');
  });

  // ─── Sort ────────────────────────────────────────────────────────────────

  it('serializes ascending sort', () => {
    const result = buildQueryString({ sort: ['nom'] });
    expect(result).toBe('sort[]=nom');
  });

  it('serializes descending sort', () => {
    const result = buildQueryString({ sort: ['-date_rencontre'] });
    expect(result).toBe('sort[]=-date_rencontre');
  });

  it('serializes multiple sort fields', () => {
    const result = buildQueryString({ sort: ['-date_rencontre', 'nom'] });
    expect(result).toBe('sort[]=-date_rencontre&sort[]=nom');
  });

  // ─── Pagination ──────────────────────────────────────────────────────────

  it('serializes limit', () => {
    expect(buildQueryString({ limit: 50 })).toBe('limit=50');
  });

  it('serializes offset', () => {
    expect(buildQueryString({ offset: 100 })).toBe('offset=100');
  });

  it('serializes limit and offset together', () => {
    expect(buildQueryString({ limit: 50, offset: 100 })).toBe('limit=50&offset=100');
  });

  // ─── Search ──────────────────────────────────────────────────────────────

  it('serializes search term', () => {
    expect(buildQueryString({ search: 'Paris' })).toBe('search=Paris');
  });

  it('encodes special characters in search', () => {
    const result = buildQueryString({ search: 'club & team' });
    expect(result).toBe('search=club%20%26%20team');
  });

  // ─── Combined (real-world queries from score.ts) ─────────────────────────

  it('reproduces poule query from score.ts', () => {
    const result = buildQueryString({
      fields: [
        'id', 'nom', 'logo.id',
        'rencontres.id', 'rencontres.numero', 'rencontres.numeroJournee',
        'rencontres.idPoule', 'rencontres.resultatEquipe1', 'rencontres.resultatEquipe2',
        'rencontres.joue', 'rencontres.nomEquipe1', 'rencontres.nomEquipe2',
        'rencontres.date_rencontre',
        'classements.id', 'classements.idEngagement.nom', 'classements.idEngagement.id',
        'classements.matchJoues', 'classements.points', 'classements.position',
        'classements.gagnes', 'classements.perdus',
      ],
      deep: {
        rencontres: {
          _limit: 1000,
          _filter: { saison: { actif: { _eq: true } } },
          _sort: ['date_rencontre'],
        },
      },
    });

    // Fields
    expect(result).toContain('fields[]=id');
    expect(result).toContain('fields[]=nom');
    expect(result).toContain('fields[]=rencontres.id');
    expect(result).toContain('fields[]=classements.idEngagement.nom');

    // Deep
    expect(result).toContain('deep[rencontres][_limit]=1000');
    expect(result).toContain('deep[rencontres][_filter][saison][actif][_eq]=true');
    expect(result).toContain('deep[rencontres][_sort][]=date_rencontre');
  });

  it('reproduces club engagements query from score.ts', () => {
    const result = buildQueryString({
      fields: [
        'id', 'nom',
        'engagements.id', 'engagements.nom', 'engagements.numeroEquipe',
        'engagements.idPoule.id', 'engagements.idPoule.nom',
        'engagements.idCompetition.id', 'engagements.idCompetition.nom',
        'engagements.idCompetition.code', 'engagements.idCompetition.typeCompetition',
        'engagements.idCompetition.saison.id',
        'engagements.idCompetition.categorie.code',
        'engagements.idCompetition.categorie.ordre',
      ],
      deep: {
        engagements: {
          _limit: 1000,
          _filter: { idCompetition: { saison: { id: { _eq: '1036' } } } },
        },
      },
    });

    expect(result).toContain('fields[]=engagements.idCompetition.typeCompetition');
    expect(result).toContain('deep[engagements][_limit]=1000');
    expect(result).toContain('deep[engagements][_filter][idCompetition][saison][id][_eq]=1036');
  });
});
