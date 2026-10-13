# ffbb-api-client

Client TypeScript pour l'API de la FFBB (Fédération Française de Basketball).

Supporte l'API REST Directus et la recherche full-text Meilisearch. Zéro dépendances runtime (utilise `fetch` natif, Node 18+).

## Installation

```bash
npm install ffbb-api-client
```

## Démarrage rapide

```typescript
import { FFBBClient } from 'ffbb-api-client';

const client = new FFBBClient();
await client.authenticate(); // Récupère les tokens automatiquement

// Récupérer un club avec ses équipes
const club = await client.getOrganisme('11402', {
  fields: ['id', 'nom', 'engagements.id', 'engagements.nom'],
  deep: { engagements: { _limit: 100 } },
});

console.log(club.nom); // "LE CLUB DE BRETTEVILLE-SUR-ODON BASKET"
```

## Authentification

### Automatique (recommandé)

```typescript
const client = new FFBBClient();
await client.authenticate(); // Récupère les tokens depuis /items/configuration
```

### Manuelle

```typescript
const client = new FFBBClient({
  token: 'votre-token-directus',
  meilisearchToken: 'votre-token-meilisearch',
});
```

## API Directus (REST)

### Récupérer un élément

```typescript
// Par collection et ID
const poule = await client.getPoule('poule-id', {
  fields: ['id', 'nom', 'rencontres.*', 'classements.*'],
  deep: {
    rencontres: {
      _limit: 1000,
      _sort: ['date_rencontre'],
      _filter: { saison: { actif: { _eq: true } } },
    },
  },
});
```

### Méthodes de commodité

```typescript
const organisme = await client.getOrganisme(id, query?);
const poule = await client.getPoule(id, query?);
const rencontre = await client.getRencontre(id, query?);
const competition = await client.getCompetition(id, query?);
const engagement = await client.getEngagement(id, query?);
```

### Accès générique

```typescript
import { COLLECTIONS } from 'ffbb-api-client';

// Get
const item = await client.get<MonType>(COLLECTIONS.salles, 'id');

// List
const items = await client.list<MonType>(COLLECTIONS.rencontres, {
  filter: { joue: { _eq: true } },
  sort: ['-date_rencontre'],
  limit: 50,
});

// Auto-pagination
for await (const item of client.listAll<Rencontre>(COLLECTIONS.rencontres)) {
  console.log(item.nomEquipe1, 'vs', item.nomEquipe2);
}
```

### Sélection de champs

Utilisez la notation pointée pour les relations :

```typescript
const club = await client.getOrganisme('11402', {
  fields: [
    'id',
    'nom',
    'engagements.id',
    'engagements.nom',
    'engagements.idCompetition.nom',
    'engagements.idCompetition.typeCompetition',
    'engagements.idCompetition.saison.id',
    'engagements.idCompetition.categorie.code',
  ],
});
```

### Filtrage

Supporte tous les opérateurs Directus :

```typescript
// Égalité
{ typeCompetition: { _eq: 'DIV' } }

// Contient
{ nom: { _contains: 'Paris' } }

// Dans une liste
{ id: { _in: ['1', '2', '3'] } }

// Relation imbriquée
{ idCompetition: { saison: { id: { _eq: '1036' } } } }
```

### Relations profondes (deep)

```typescript
const club = await client.getOrganisme('11402', {
  deep: {
    engagements: {
      _limit: 1000,
      _filter: { idCompetition: { saison: { id: { _eq: '1036' } } } },
      _sort: ['nom'],
    },
  },
});
```

## Recherche Meilisearch

```typescript
// Recherche simple
const results = await client.searchIndex<Organisme>('ffbbserver_organismes', {
  q: 'Paris',
  limit: 10,
});

for (const hit of results.hits) {
  console.log(hit.nom);
}

// Recherche multi-index
const multi = await client.multiSearch([
  { indexUid: 'ffbbserver_organismes', q: 'Paris', limit: 5 },
  { indexUid: 'ffbbserver_competitions', q: 'U13', limit: 5 },
]);
```

### Recherche géographique

```typescript
import { buildGeoSort, buildGeoFilter, GeoSortOrder } from 'ffbb-api-client';

const results = await client.searchIndex<Organisme>('ffbbserver_organismes', {
  q: 'basketball',
  filter: buildGeoFilter(48.8566, 2.3522, 50), // 50km autour de Paris
  sort: [buildGeoSort(48.8566, 2.3522, GeoSortOrder.NEAREST_FIRST)],
  limit: 10,
});
```

## Assets (logos, images)

```typescript
// Construire une URL
const logoUrl = client.assetUrl('uuid', {
  width: 300,
  height: 300,
  fit: 'inside',
  quality: 80,
  format: 'webp',
});

// Télécharger
const buffer = await client.downloadAsset('uuid', { width: 300, format: 'webp' });
```

## Endpoints spéciaux

```typescript
// Version de l'API
const version = await client.getApiVersion();

// Matchs en direct
const lives = await client.getLives();

// Saisons
const saisons = await client.getSaisons();
```

## Accès bas niveau

Pour des requêtes avancées, accédez directement aux clients sous-jacents :

```typescript
// Directus REST
const data = await client.directus.request<any>('/custom/endpoint');

// Meilisearch
const results = await client.search.search<any>('ffbbserver_organismes', { q: 'test' });
```

## Utilitaire Query Builder

Le query builder peut être utilisé de manière autonome :

```typescript
import { buildQueryString } from 'ffbb-api-client';

const qs = buildQueryString({
  fields: ['id', 'nom', 'rencontres.id'],
  deep: { rencontres: { _limit: 1000 } },
  filter: { typeCompetition: { _eq: 'DIV' } },
  sort: ['-date_rencontre'],
  limit: 50,
});
// "fields[]=id&fields[]=nom&fields[]=rencontres.id&deep[rencontres][_limit]=1000&..."
```

## Gestion des erreurs

```typescript
import { FFBBError, FFBBAuthError, FFBBRequestError, FFBBTimeoutError } from 'ffbb-api-client';

try {
  await client.getPoule('123');
} catch (e) {
  if (e instanceof FFBBAuthError) {
    // Token invalide ou expiré → ré-authentifier
    await client.authenticate();
  } else if (e instanceof FFBBTimeoutError) {
    console.error(`Timeout après ${e.timeoutMs}ms`);
  } else if (e instanceof FFBBRequestError) {
    console.error(`HTTP ${e.status}: ${e.statusText}`);
  } else if (e instanceof FFBBError) {
    console.error('Erreur API:', e.message);
  }
}
```

## Modèle de données : phases et équipes

L'API FFBB gère les compétitions en **phases** (Phase 1 = saison régulière, Phase 2 = play-offs / accession). Chaque phase est une compétition distincte, ce qui crée des engagements séparés pour la même équipe.

### Hiérarchie des entités

```
Organisme (club)
 └── Engagement (inscription d'une équipe dans une compétition)
      ├── idCompetition (compétition / phase)
      │    ├── id, nom, code
      │    ├── categorie (SE, U13, U18...)
      │    ├── idCompetitionPere → null (Phase 1) ou { id, nom } (Phase 2 → pointe vers Phase 1)
      │    └── typeCompetitionGenerique → logo
      └── idPoule (poule dans laquelle joue l'équipe)
           ├── rencontres[] (matchs)
           └── classements[] (classement de la poule)
```

### Identifier les phases

Le champ `idCompetitionPere` sur une compétition permet de lier Phase 2 → Phase 1 :

- **Phase 1** : `idCompetitionPere` est `null`
- **Phase 2** : `idCompetitionPere.id` pointe vers l'ID de la compétition Phase 1

```typescript
// Récupérer les engagements avec le lien entre phases
const club = await client.getOrganisme('11402', {
  fields: [
    'id', 'nom',
    'engagements.id', 'engagements.nom', 'engagements.numeroEquipe',
    'engagements.idPoule.id', 'engagements.idPoule.nom',
    'engagements.idCompetition.id', 'engagements.idCompetition.nom',
    'engagements.idCompetition.code', 'engagements.idCompetition.typeCompetition',
    'engagements.idCompetition.saison.id',
    'engagements.idCompetition.categorie.code',
    'engagements.idCompetition.categorie.ordre',
    // Lien Phase 2 → Phase 1
    'engagements.idCompetition.idCompetitionPere.id',
    'engagements.idCompetition.idCompetitionPere.nom',
  ],
  deep: {
    engagements: {
      _limit: 1000,
      _filter: { idCompetition: { saison: { id: { _eq: '1036' } } } },
    },
  },
});
```

### Grouper les phases d'une même équipe

```typescript
const engagements = club.engagements;

// Séparer Phase 1 et Phase 2
const phase1 = engagements.filter(e => !e.idCompetition.idCompetitionPere);
const phase2 = engagements.filter(e => !!e.idCompetition.idCompetitionPere);

// Construire la map Phase 1 : competitionId → engagement
const phase1Map = new Map(phase1.map(e => [e.idCompetition.id, e]));

// Associer chaque Phase 2 à sa Phase 1
for (const p2 of phase2) {
  const parentCompetitionId = p2.idCompetition.idCompetitionPere.id;
  const p1 = phase1Map.get(parentCompetitionId);
  // p1 peut être undefined si le club n'avait pas d'engagement
  // dans cette compétition en Phase 1 (changement de division)
}
```

### Récupérer matchs et classements d'une poule

Chaque engagement est lié à une poule (`idPoule`). La poule contient les rencontres et classements :

```typescript
const poule = await client.getPoule(engagement.idPoule.id, {
  fields: [
    'id', 'nom',
    'rencontres.id', 'rencontres.numero', 'rencontres.numeroJournee',
    'rencontres.resultatEquipe1', 'rencontres.resultatEquipe2',
    'rencontres.joue', 'rencontres.nomEquipe1', 'rencontres.nomEquipe2',
    'rencontres.date_rencontre',
    'rencontres.idEngagementEquipe1.id', 'rencontres.idEngagementEquipe1.nom',
    'rencontres.idEngagementEquipe1.idOrganisme.code',
    'rencontres.idOrganismeEquipe1.id', 'rencontres.idOrganismeEquipe1.logo.id',
    'rencontres.idEngagementEquipe2.id', 'rencontres.idEngagementEquipe2.nom',
    'rencontres.idEngagementEquipe2.idOrganisme.code',
    'rencontres.idOrganismeEquipe2.id', 'rencontres.idOrganismeEquipe2.logo.id',
    'rencontres.salle.libelle', 'rencontres.salle.commune.libelle',
    'classements.id', 'classements.idEngagement.id', 'classements.idEngagement.nom',
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
```

### Filtrer les matchs d'un club

Les matchs (`rencontres`) d'une poule concernent toutes les équipes de la poule. Pour isoler ceux d'un club :

```typescript
const CLUB_CODE = 'NOR0014042';

const clubMatches = poule.rencontres.filter(match =>
  match.idEngagementEquipe1?.idOrganisme?.code === CLUB_CODE ||
  match.idEngagementEquipe2?.idOrganisme?.code === CLUB_CODE
);
```

### Conventions de nommage des codes

| Pattern      | Exemple                                             | Signification                     |
|--------------|-----------------------------------------------------|-----------------------------------|
| `PNM`        | Pré nationale masculine                             | Code Phase 1                      |
| `PNM-P2`     | Pré nationale masculine - Phase 2                   | Code Phase 2 (suffixe `-P2`)      |
| `DMU13-2`    | Départementale masculine U13 - Division 2           | Suffixe `-N` = numéro de division |
| `DMU18-2-P2` | Départementale masculine U18 - Division 2 - Phase 2 | Division + Phase                  |

Le code seul n'est pas fiable pour lier les phases (la division peut changer entre Phase 1 et Phase 2). Utiliser `idCompetitionPere` à la place.

## Collections disponibles

```typescript
import { COLLECTIONS } from 'ffbb-api-client';

COLLECTIONS.organismes    // 'ffbbserver_organismes'
COLLECTIONS.poules        // 'ffbbserver_poules'
COLLECTIONS.rencontres    // 'ffbbserver_rencontres'
COLLECTIONS.competitions  // 'ffbbserver_competitions'
COLLECTIONS.engagements   // 'ffbbserver_engagements'
COLLECTIONS.salles        // 'ffbbserver_salles'
COLLECTIONS.terrains      // 'ffbbserver_terrains'
COLLECTIONS.tournois      // 'ffbbserver_tournois'
COLLECTIONS.entraineurs   // 'ffbbserver_entraineeurs'
COLLECTIONS.formations    // 'ffbbserver_formations'
COLLECTIONS.pratiques     // 'ffbbnational_pratiques'
COLLECTIONS.communes      // 'ffbbserver_communes'
COLLECTIONS.officiels     // 'ffbbserver_officiels'
COLLECTIONS.saisons       // 'ffbbserver_saisons'
```

## Types exportés

Tous les types des collections sont exportés :

```typescript
import type {
  Organisme, Engagement, Competition, Poule, Rencontre,
  Classement, Salle, Saison, Terrain, Tournoi, Entraineur,
  Formation, Commune, Officiel, Pratique, ApiVersion, LiveMatch,
  Logo, Configuration,
  // Query types
  DirectusQuery, DirectusFilter, DeepConfig, DirectusResponse,
  // Meilisearch types
  MeilisearchQuery, MeilisearchResponse, MeilisearchIndex,
  MultiSearchQuery, MultiSearchResponse,
} from 'ffbb-api-client';
```

## Configuration

| Option             | Défaut                              | Description                                       |
|--------------------|-------------------------------------|---------------------------------------------------|
| `baseUrl`          | `DEFAULT_BASE_URLS`                 | URL de base de l'API Directus, ou liste d'URLs de fallback |
| `token`            | —                                   | Token Directus (sinon, utiliser `authenticate()`) |
| `meilisearchUrl`   | `https://meilisearch-prod.ffbb.app` | URL Meilisearch                                   |
| `meilisearchToken` | —                                   | Token Meilisearch                                 |
| `fetch`            | `globalThis.fetch`                  | Implémentation fetch personnalisée                |
| `timeout`          | `30000`                             | Timeout des requêtes en ms                        |

### Fallback entre URLs

Par défaut, le client interroge `https://bo.ffbb.com`, puis `https://bo.ffbb.app`, puis `https://api.ffbb.com` (`DEFAULT_BASE_URLS`).
En cas d'erreur réseau, de timeout ou de réponse HTTP 5xx, la requête est rejouée sur l'URL suivante. L'URL qui a répondu devient l'URL utilisée en priorité pour les requêtes suivantes (y compris pour `assetUrl()`). Les erreurs 4xx ne déclenchent pas de fallback.

```ts
// Liste personnalisée
const client = new FFBBClient({ baseUrl: ['https://bo.ffbb.app', 'https://api.ffbb.com'] });

// Une seule URL, sans fallback
const client = new FFBBClient({ baseUrl: 'https://api.ffbb.com' });
```

## Licence

MIT
