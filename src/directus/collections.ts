/**
 * Directus collection names for the FFBB API.
 *
 * Use these constants instead of raw strings to avoid typos.
 *
 * @example
 * ```ts
 * const clubs = await client.list(COLLECTIONS.organismes, { limit: 10 });
 * ```
 */
export const COLLECTIONS = {
  competitions: 'ffbbserver_competitions',
  poules: 'ffbbserver_poules',
  rencontres: 'ffbbserver_rencontres',
  organismes: 'ffbbserver_organismes',
  entraineurs: 'ffbbserver_entraineeurs',
  salles: 'ffbbserver_salles',
  terrains: 'ffbbserver_terrains',
  tournois: 'ffbbserver_tournois',
  engagements: 'ffbbserver_engagements',
  formations: 'ffbbserver_formations',
  pratiques: 'ffbbnational_pratiques',
  communes: 'ffbbserver_communes',
  officiels: 'ffbbserver_officiels',
  saisons: 'ffbbserver_saisons',
} as const;

/** Union type of all FFBB Directus collection names. */
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
