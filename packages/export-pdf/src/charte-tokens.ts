/**
 * Tokens de la charte graphique CEFF pour les exports PDF.
 *
 * Toutes les valeurs proviennent de la charte officielle (fichier HTML fourni
 * par CEFF). Aucune autre couleur, police ou taille ne doit etre utilisee dans
 * les exports PDF.
 *
 * IMPORTANT : pdf-lib utilise des couleurs RGB normalisees (0-1), pas en hex.
 * Toutes les couleurs sont definies en double : la valeur hex pour reference
 * et le triplet RGB pour pdf-lib.
 */

import { rgb } from 'pdf-lib';

/** Couleurs officielles de la charte CEFF, en hex et en triplet RGB normalise. */
export const CEFF_COLORS = {
  /** Bleu marine - bandeau d'entete principal. */
  bleuMarine: { hex: '#1F3864', rgb: rgb(31 / 255, 56 / 255, 100 / 255) },
  /** Rouge cramoisi - bandeau de synthese sous le bandeau bleu. */
  rougeCramoisi: { hex: '#9B2020', rgb: rgb(155 / 255, 32 / 255, 32 / 255) },
  /** Gris anthracite - texte secondaire. */
  grisAnthracite: { hex: '#404040', rgb: rgb(64 / 255, 64 / 255, 64 / 255) },
  /** Rouge alerte - alertes et couleur etiquette rouge. */
  rougeAlerte: { hex: '#C00000', rgb: rgb(192 / 255, 0, 0) },
  /** Noir - corps de texte courant et couleur etiquette noir. */
  noir: { hex: '#000000', rgb: rgb(0, 0, 0) },
  /** Blanc - couleur etiquette blanc et fond de page. */
  blanc: { hex: '#FFFFFF', rgb: rgb(1, 1, 1) },
} as const;

/**
 * Tailles de police en points (1 pt = 1/72 inch).
 * Charte CEFF : Arial uniquement, 5 niveaux de taille.
 */
export const CEFF_FONT_SIZES = {
  titre1: 24, // bandeau bleu marine, titre principal
  titre2: 18, // bandeau rouge cramoisi
  titre3: 14, // sous-titres
  corps: 11, // corps de texte
  cote: 9, // cotes des plans techniques (specifique a notre PDF)
  coteCompacte: 8, // cotes courtes (LONG : 18 mm)
} as const;

/**
 * Dimensions de mise en page du PDF en millimetres.
 *
 * Le PDF principal est A3 paysage avec en-tete CEFF + plan technique cote.
 */
export const PDF_LAYOUT_MM = {
  /** Hauteur du logo CEFF (carre, dans la zone d'en-tete a gauche). */
  logoHeight: 22,
  /** Largeur de la zone reservee au logo a gauche de l'entete. */
  logoZoneWidth: 35,
  /** Hauteur du bandeau bleu marine. */
  blueBannerHeight: 13,
  /** Hauteur du bandeau rouge cramoisi. */
  redBannerHeight: 10,
  /** Marge interne du bandeau (texte). */
  bannerPadding: 6,
  /** Espace entre l'entete et le debut du plan. */
  headerToPlanGap: 8,
  /** Hauteur d'une rangee dessinee dans le plan (bord superieur a inferieur). */
  rowHeight: 12,
  /** Espace pour la zone de cotation sous chaque rangee. */
  rowCotationZoneHeight: 14,
  /** Espace pour la cote totale en bas de chaque rangee. */
  rowTotalCotationHeight: 8,
  /** Espacement vertical entre deux rangees consecutives. */
  rowGap: 14,
  /** Largeur de la colonne "Rangee X" a gauche du plan. */
  rowLabelColumnWidth: 22,
  /** Longueur des fleches de cote (tetes de fleche). */
  arrowSize: 2.5,
  /** Epaisseur des traits du plan (rectangles d'etiquettes). */
  labelStrokeWidth: 0.4,
  /** Epaisseur des traits de cote. */
  cotationStrokeWidth: 0.2,
} as const;

/**
 * Conversions entre millimetres et points PDF.
 *
 * 1 inch = 25.4 mm = 72 pt
 * 1 mm = 72 / 25.4 = 2.8346... pt
 */
export const MM_TO_PT = 72 / 25.4;
export const PT_TO_MM = 25.4 / 72;

/** Convertit une dimension en mm vers des points PDF. */
export function mm(value: number): number {
  return value * MM_TO_PT;
}

/** Convertit une dimension en points PDF vers des mm. */
export function pt(value: number): number {
  return value * PT_TO_MM;
}
