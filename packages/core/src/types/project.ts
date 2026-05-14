/**
 * Modele de donnees source de verite. Toutes les vues (UI, PDF, Excel) sont des
 * projections de Project. Aucune donnee dupliquee ailleurs dans le systeme.
 */

import type { LabelColor, LabelHeightMm } from './units.js';

/**
 * Largeur de tableau en modules. Doit etre paire et comprise entre 12 et 36.
 * On garde number plutot qu'une union litterale pour permettre les futurs ajouts
 * sans casser l'API. La validation est faite par le validateur.
 */
export type TableWidthModules = number;

/**
 * Largeur ou position en demi-modules. Doit etre un entier strictement positif.
 *
 * Choix d'unite : on stocke tout en demi-modules entiers pour eviter les erreurs
 * d'arrondi en virgule flottante lors des sommes de positions. La conversion en
 * millimetres se fait par multiplication par HALF_MODULE_MM (= 9 mm).
 */
export type HalfModules = number;

/**
 * Dimension hors grille demi-module, en millimetres.
 *
 * Cas d'usage : un equipement dont la largeur reelle ne tombe pas sur un multiple
 * de 9 mm (par exemple un "GENERAL CHAUFFAGE" qui doit faire exactement 200 mm
 * pour des raisons de cablage interne, alors que la grille donnerait 198 ou 207).
 *
 * Quand widthMm est defini, il prevaut sur widthHalfModules pour les calculs
 * dimensionnels et l'affichage des cotes. widthHalfModules reste utilise pour
 * la position dans la rangee.
 */
export type OffGridWidthMm = number;

/** Identifiant unique d'un equipement, d'une rangee ou d'un projet. */
export type EntityId = string;

/**
 * Equipement modulaire pose sur une rangee.
 *
 * Position et largeur en demi-modules pour respecter la grille. Le champ optionnel
 * widthMm permet de declarer une largeur reelle hors grille (ex : 200 mm exact)
 * quand la pose physique l'exige.
 */
export interface Equipment {
  readonly id: EntityId;
  readonly rowId: EntityId;

  /** Position du bord gauche dans la rangee, en demi-modules depuis la gauche (>= 0). */
  positionHalfModules: HalfModules;

  /** Largeur de l'equipement en demi-modules (entier >= 1). */
  widthHalfModules: HalfModules;

  /**
   * Largeur reelle en millimetres si elle ne tombe pas sur la grille demi-module.
   * Optionnel. Quand defini, prevaut sur widthHalfModules pour l'affichage des cotes
   * mais widthHalfModules reste l'occupation logique dans la rangee.
   */
  widthMm?: OffGridWidthMm;

  /** Texte affiche sur l'etiquette. 1 a 3 lignes, separees par '\n'. */
  text: string;
}

/**
 * Rangee d'un tableau electrique.
 *
 * La hauteur des etiquettes est unique pour tout le tableau (cf. Project.heightMm),
 * elle n'apparait pas au niveau de la rangee.
 */
export interface Row {
  readonly id: EntityId;

  /** Index de la rangee (0-based). Determine l'ordre d'affichage. */
  index: number;

  /** Equipements de la rangee, dans l'ordre des positions. */
  equipments: Equipment[];
}

/**
 * Projet d'etiquetage. Source unique de verite pour l'editeur et tous les exports.
 *
 * Chaque projet decrit un tableau electrique avec ses rangees et equipements.
 * La largeur, la hauteur d'etiquette et les couleurs par defaut sont globales.
 */
export interface Project {
  readonly id: EntityId;

  /** Nom interne du projet (sert pour la sauvegarde locale). */
  name: string;

  /** Reference de l'affaire client, affichee dans le bandeau bleu du PDF. */
  affaire: string;

  /** Largeur du tableau en modules. Doit etre paire entre 12 et 36. */
  widthModules: TableWidthModules;

  /** Hauteur unique des etiquettes, en millimetres. */
  heightMm: LabelHeightMm;

  /** Couleur de fond appliquee a toutes les etiquettes du tableau. */
  bgColor: LabelColor;

  /** Couleur du texte appliquee a toutes les etiquettes du tableau. */
  textColor: LabelColor;

  /** Valeur hex (#RRGGBB) quand bgColor === 'personnalise'. */
  customBgColorHex?: string;

  /** Valeur hex (#RRGGBB) quand textColor === 'personnalise'. */
  customTextColorHex?: string;

  /** Rangees du tableau, ordonnees par index croissant. */
  rows: Row[];

  /** Timestamp de creation (ms depuis epoch). */
  readonly createdAt: number;

  /** Timestamp de derniere modification (ms depuis epoch). */
  updatedAt: number;

  /** Version du schema pour les migrations futures. */
  readonly schemaVersion: 1;
}
