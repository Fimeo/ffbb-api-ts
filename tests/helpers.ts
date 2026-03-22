import { vi } from 'vitest';

/**
 * Create a mock fetch function that matches URL patterns to canned responses.
 *
 * @param responses - Map of URL substrings to response data
 * @param defaultStatus - Default status code for matched responses
 */
export function createMockFetch(
  responses: Record<string, unknown>,
  defaultStatus: number = 200,
): ReturnType<typeof vi.fn> & typeof fetch {
  return vi.fn(((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    const match = Object.entries(responses).find(([pattern]) => url.includes(pattern));

    if (match) {
      const [, data] = match;
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          status: defaultStatus,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    return Promise.resolve(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      }),
    );
  }) as typeof fetch);
}

/**
 * Create a mock fetch that returns a specific HTTP error.
 */
export function createErrorFetch(
  status: number,
  statusText: string = 'Error',
  body?: unknown,
): ReturnType<typeof vi.fn> & typeof fetch {
  return vi.fn((() => {
    return Promise.resolve(
      new Response(body ? JSON.stringify(body) : statusText, {
        status,
        statusText,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      }),
    );
  }) as typeof fetch);
}

/**
 * Create a mock fetch that throws a network error.
 */
export function createNetworkErrorFetch(message: string = 'Network error'): ReturnType<typeof vi.fn> & typeof fetch {
  return vi.fn((() => {
    return Promise.reject(new TypeError(message));
  }) as typeof fetch);
}

/** Sample configuration response from the FFBB API. */
export const MOCK_CONFIGURATION = {
  data: {
    id: 1,
    date_created: '2024-01-01T00:00:00Z',
    date_updated: '2024-06-01T00:00:00Z',
    user_created: 'system',
    user_updated: null,
    key_dh: 'test-directus-token-abc123',
    key_ms: 'test-meilisearch-token-xyz789',
    ios_version: '2.0.0',
    android_version: '2.0.0',
    key_directus_website: 'website-key',
    key_directus_competitions: null,
  },
};

/** Sample organisme response. */
export const MOCK_ORGANISME = {
  data: {
    id: '11402',
    nom: 'LE CLUB DE BRETTEVILLE-SUR-ODON BASKET',
    code: 'NOR0014042',
    engagements: [
      {
        id: 'eng-1',
        nom: 'U13M - 1',
        numeroEquipe: '1',
        idPoule: { id: 'poule-1', nom: 'Poule A' },
        idCompetition: {
          id: 'comp-1',
          nom: 'U13 Masculin',
          code: 'U13M',
          typeCompetition: 'DIV',
          saison: { id: '1036' },
          categorie: { code: 'U13', ordre: 5 },
        },
      },
    ],
  },
};

/** Sample poule response with matches and standings. */
export const MOCK_POULE = {
  data: {
    id: 'poule-1',
    nom: 'Poule A',
    logo: null,
    rencontres: [
      {
        id: 'match-1',
        numero: '001',
        numeroJournee: '1',
        idPoule: 'poule-1',
        resultatEquipe1: 45,
        resultatEquipe2: 38,
        joue: true,
        nomEquipe1: 'LCBO - 1',
        nomEquipe2: 'CAEN BC - 2',
        date_rencontre: '2025-10-12T14:00:00Z',
        idEngagementEquipe1: { id: 'eng-1', nom: 'LCBO - 1', idOrganisme: { code: 'NOR0014042' } },
        idEngagementEquipe2: { id: 'eng-2', nom: 'CAEN BC - 2', idOrganisme: { code: 'NOR0014001' } },
        idOrganismeEquipe1: { id: 'org-1', logo: { id: 'logo-uuid-1' } },
        idOrganismeEquipe2: { id: 'org-2', logo: { id: 'logo-uuid-2' } },
        salle: {
          libelle: 'Gymnase de l\'Eglise',
          commune: { libelle: 'Bretteville-sur-Odon', codePostal: '14760' },
        },
      },
      {
        id: 'match-2',
        numero: '002',
        numeroJournee: '2',
        idPoule: 'poule-1',
        resultatEquipe1: null,
        resultatEquipe2: null,
        joue: false,
        nomEquipe1: 'CAEN BC - 2',
        nomEquipe2: 'LCBO - 1',
        date_rencontre: '2025-11-09T15:00:00Z',
        idEngagementEquipe1: { id: 'eng-2', nom: 'CAEN BC - 2', idOrganisme: { code: 'NOR0014001' } },
        idEngagementEquipe2: { id: 'eng-1', nom: 'LCBO - 1', idOrganisme: { code: 'NOR0014042' } },
        idOrganismeEquipe1: { id: 'org-2', logo: { id: 'logo-uuid-2' } },
        idOrganismeEquipe2: { id: 'org-1', logo: { id: 'logo-uuid-1' } },
        salle: {
          libelle: 'Palais des Sports',
          commune: { libelle: 'Caen', codePostal: '14000' },
        },
      },
    ],
    classements: [
      {
        id: 'rank-1',
        idEngagement: { nom: 'LCBO - 1', id: 'eng-1' },
        matchJoues: '5',
        points: '13',
        position: '1',
        gagnes: '4',
        perdus: '1',
      },
      {
        id: 'rank-2',
        idEngagement: { nom: 'CAEN BC - 2', id: 'eng-2' },
        matchJoues: '5',
        points: '11',
        position: '2',
        gagnes: '3',
        perdus: '2',
      },
    ],
  },
};
