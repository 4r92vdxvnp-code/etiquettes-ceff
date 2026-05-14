/**
 * Constantes physiques et metier du domaine "etiquetage tableau electrique modulaire".
 *
 * Regle d'or : toutes les positions et largeurs sont stockees en demi-modules entiers.
 * Un demi-module = 9 mm. Un module = 18 mm. Conversion en mm uniquement a l'affichage
 * et a l'export.
 */

// --- Modules ---

/** Largeur d'un demi-module en millimetres. Unite de stockage interne. */
export const HALF_MODULE_MM = 9;

/** Largeur d'un module standard en millimetres (= 2 demi-modules). */
export const FULL_MODULE_MM = 18;

/** Largeur minimale d'un equipement, en demi-modules (= 0,5 module = 9 mm). */
export const MIN_EQUIPMENT_HALF_MODULES = 1;

/** Largeur maximale d'un equipement, en demi-modules (= 12 modules = 216 mm). */
export const MAX_EQUIPMENT_HALF_MODULES = 24;

// --- Tableau ---

/** Largeur minimale d'un tableau en modules. */
export const MIN_TABLE_WIDTH_MODULES = 12;

/** Largeur maximale d'un tableau en modules. */
export const MAX_TABLE_WIDTH_MODULES = 36;

/** Nombre minimal de rangees. */
export const MIN_ROW_COUNT = 1;

/** Nombre maximal de rangees. */
export const MAX_ROW_COUNT = 50;

// --- Etiquettes ---

/** Hauteurs d'etiquette proposees en mm (valeurs standard). Saisie libre autorisee. */
export const LABEL_HEIGHTS_MM = [15, 30, 40, 50, 100] as const;

/**
 * Hauteur d'etiquette en millimetres.
 * Valeurs standards : 15, 30, 40, 50, 100 mm. Saisie libre autorisee au-dela.
 */
export type LabelHeightMm = number;

/** Couleurs autorisees pour le fond et le texte des etiquettes. */
export const LABEL_COLORS = ['rouge', 'noir', 'blanc', 'personnalise'] as const;

/** Type des couleurs d'etiquette autorisees. */
export type LabelColor = (typeof LABEL_COLORS)[number];

/**
 * Mapping des couleurs etiquette vers leur valeur hexadecimale officielle.
 * 'personnalise' utilise #000000 par defaut ; la valeur reelle est dans
 * Project.customBgColorHex / customTextColorHex.
 */
export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  rouge: '#C00000',
  noir: '#000000',
  blanc: '#FFFFFF',
  personnalise: '#000000',
};

/** Libelle francais affichable d'une couleur, avec majuscule initiale. */
export const LABEL_COLOR_LABEL: Record<LabelColor, string> = {
  rouge: 'Rouge',
  noir: 'Noir',
  blanc: 'Blanc',
  personnalise: 'Personnalise',
};

/**
 * Retourne la valeur hexadecimale effective d'une couleur d'etiquette.
 * Pour 'personnalise', utilise customHex si fourni, sinon #000000.
 */
export function effectiveColorHex(color: LabelColor, customHex?: string): string {
  if (color === 'personnalise') return customHex ?? '#000000';
  return LABEL_COLOR_HEX[color];
}

// --- Format A3 paysage ---

/** Dimensions du format A3 paysage en millimetres. */
export const A3_LANDSCAPE_MM = { width: 420, height: 297 } as const;

/** Marge peripherique de la page A3 en millimetres. */
export const A3_MARGIN_MM = 10;

/** Surface utile de la page A3 paysage (apres marges). */
export const A3_USABLE_MM = {
  width: A3_LANDSCAPE_MM.width - 2 * A3_MARGIN_MM,
  height: A3_LANDSCAPE_MM.height - 2 * A3_MARGIN_MM,
} as const;

/** Largeur reservee a la colonne "Rangee X" a gauche du dessin, en millimetres. */
export const ROW_LABEL_COLUMN_MM = 50;

/** Largeur disponible pour le dessin du tableau, en millimetres. */
export const DRAWING_WIDTH_MM = A3_USABLE_MM.width - ROW_LABEL_COLUMN_MM - A3_MARGIN_MM;
