// ─── Configuration ───────────────────────────────────────────────────────────

export interface Configuration {
  id: number;
  date_created: string;
  date_updated: string;
  user_created: string;
  user_updated: string | null;
  key_dh: string;
  key_ms: string;
  ios_version: string;
  android_version: string;
  key_directus_website: string;
  key_directus_competitions: string | null;
}

// ─── Logo / Asset ────────────────────────────────────────────────────────────

export interface Logo {
  id: string;
  gradient_color?: string;
}

// ─── Organisme (Club / Organization) ─────────────────────────────────────────

export interface Organisme {
  id: string;
  nom: string;
  code?: string;
  logo?: Logo | null;
  mail?: string;
  telephone?: string;
  engagements?: Engagement[];
}

// ─── Saison ──────────────────────────────────────────────────────────────────

export interface Saison {
  id: string;
  actif?: boolean;
  nom?: string;
}

// ─── Competition ─────────────────────────────────────────────────────────────

export interface Competition {
  id: string;
  nom: string;
  code: string;
  typeCompetition: string;
  saison: Saison;
  categorie: {
    code: string;
    ordre: number;
  };
  typeCompetitionGenerique?: {
    logo?: Logo;
  };
}

// ─── Engagement (Team in a competition) ──────────────────────────────────────

export interface Engagement {
  id: string;
  nom: string;
  numeroEquipe: string;
  idOrganisme?: Organisme;
  idPoule?: {
    id: string;
    nom: string;
  };
  idCompetition: Competition;
}

// ─── Salle (Sports hall) ─────────────────────────────────────────────────────

export interface Salle {
  libelle: string;
  adresse?: string;
  commune: {
    codePostal?: string;
    libelle: string;
  };
  cartographie?: {
    latitude: number;
    longitude: number;
  };
}

// ─── Rencontre (Match / Encounter) ───────────────────────────────────────────

export interface Rencontre {
  id: string;
  numero: string;
  numeroJournee: string;
  idPoule: string;
  resultatEquipe1: number | string | null;
  resultatEquipe2: number | string | null;
  joue: boolean;
  nomEquipe1: string;
  nomEquipe2: string;
  date_rencontre: string;
  idEngagementEquipe1?: {
    id: string;
    nom: string;
    idOrganisme?: {
      code: string;
    };
  };
  idEngagementEquipe2?: {
    id: string;
    nom: string;
    idOrganisme?: {
      code: string;
    };
  };
  idOrganismeEquipe1?: {
    id: string;
    logo?: Logo | null;
  };
  idOrganismeEquipe2?: {
    id: string;
    logo?: Logo | null;
  };
  salle?: Salle;
}

// ─── Classement (Ranking / Standing) ─────────────────────────────────────────

export interface Classement {
  id: string;
  idEngagement?: {
    nom: string;
    id: string;
  };
  matchJoues: string;
  points: string;
  position: string;
  gagnes: string;
  perdus: string;
}

// ─── Poule (Pool / Group) ────────────────────────────────────────────────────

export interface Poule {
  id: string;
  nom: string;
  logo?: Logo | null;
  rencontres: Rencontre[];
  classements: Classement[];
}

// ─── Terrain (Court / Field) ─────────────────────────────────────────────────

export interface Terrain {
  id: string;
  nom?: string;
  libelle?: string;
  salle?: Salle;
}

// ─── Tournoi (Tournament) ────────────────────────────────────────────────────

export interface Tournoi {
  id: string;
  nom?: string;
  date_debut?: string;
  date_fin?: string;
}

// ─── Entraineur (Coach) ──────────────────────────────────────────────────────

export interface Entraineur {
  id: string;
  nom?: string;
  prenom?: string;
}

// ─── Formation ───────────────────────────────────────────────────────────────

export interface Formation {
  id: string;
  nom?: string;
}

// ─── Commune ─────────────────────────────────────────────────────────────────

export interface Commune {
  id: string;
  libelle: string;
  codePostal?: string;
}

// ─── Officiel ────────────────────────────────────────────────────────────────

export interface Officiel {
  id: string;
  nom?: string;
  prenom?: string;
}

// ─── Pratique ────────────────────────────────────────────────────────────────

export interface Pratique {
  id: string;
  nom?: string;
}

// ─── API Version ─────────────────────────────────────────────────────────────

export interface ApiVersion {
  version: string;
  title: string;
}

// ─── Live match ──────────────────────────────────────────────────────────────

export interface LiveMatch {
  id: string;
  [key: string]: unknown;
}
