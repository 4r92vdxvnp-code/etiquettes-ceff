/**
 * Libelles francais utilises dans les exports PDF et Excel.
 *
 * Tous les libelles generes automatiquement par l'application utilisent une
 * orthographe correcte en francais, independamment des libellaiges historiques
 * du modele d'exemple fourni par CEFF (qui contenait LONGEUR au lieu de LONGUEUR,
 * RANGEMANT au lieu de RANGEMENT, etc.).
 *
 * Les textes saisis par l'utilisateur dans les etiquettes ne sont pas corriges :
 * c'est sa saisie, on la respecte.
 */

import { LABEL_COLOR_LABEL, type LabelColor } from '../types/units.js';

/**
 * Genere le libelle "Rangee N" pour la colonne de gauche du PDF.
 *
 * @param index - Index 0-based de la rangee. Affiche en 1-based.
 */
export function rowLabel(index: number): string {
  return `Rang\u00e9e ${index + 1}`;
}

/**
 * Genere le libelle de cote courte d'un equipement, sur deux lignes.
 *
 * @example
 *   equipmentLengthLabel(36) // "LONGUEUR :\n36 mm"
 */
export function equipmentLengthLabel(widthMm: number): string {
  return `LONGUEUR :\n${formatMm(widthMm)}`;
}

/**
 * Variante compacte pour les equipements etroits (largeur affichee < 60 mm).
 * Utilise "LONG" abrege a la place de "LONGUEUR".
 *
 * @example
 *   equipmentLengthLabelCompact(18) // "LONG :\n18 mm"
 */
export function equipmentLengthLabelCompact(widthMm: number): string {
  return `LONG :\n${formatMm(widthMm)}`;
}

/**
 * Libelle de la cote totale d'une rangee.
 *
 * @example
 *   rowTotalLengthLabel(324) // "LONGUEUR TOTALE : 324 mm"
 */
export function rowTotalLengthLabel(totalMm: number): string {
  return `LONGUEUR TOTALE : ${formatMm(totalMm)}`;
}

/**
 * Libelle du bandeau bleu marine en haut du PDF.
 *
 * @example
 *   blueBannerLabel('Lycee Camille Claudel') // "ETIQUETAGE TABLEAU MODULAIRE - Affaire : Lycee Camille Claudel"
 */
export function blueBannerLabel(affaire: string): string {
  const safeAffaire = affaire.trim() === '' ? '....' : affaire.trim();
  return `ETIQUETAGE TABLEAU MODULAIRE \u00b7 Affaire : ${safeAffaire}`;
}

/**
 * Libelle du bandeau rouge cramoisi sous le bandeau bleu.
 * Synthese des choix globaux du projet : capacite, hauteur, couleurs.
 *
 * @example
 *   redBannerLabel({ widthModules: 18, capacityMm: 324, heightMm: 15, bgColor: 'blanc', textColor: 'noir' })
 *   // "Capacite par rangee : 18 modules = 324 mm - Hauteur etiquette : 15 mm - Fond : Blanc - Texte : Noir"
 */
export function redBannerLabel(params: {
  widthModules: number;
  capacityMm: number;
  heightMm: number;
  bgColor: LabelColor;
  textColor: LabelColor;
  customBgColorHex?: string;
  customTextColorHex?: string;
}): string {
  const { widthModules, capacityMm, heightMm, bgColor, textColor, customBgColorHex, customTextColorHex } = params;
  const bgLabel = bgColor === 'personnalise' && customBgColorHex ? customBgColorHex : LABEL_COLOR_LABEL[bgColor];
  const textLabel = textColor === 'personnalise' && customTextColorHex ? customTextColorHex : LABEL_COLOR_LABEL[textColor];
  return [
    `Capacit\u00e9 par rang\u00e9e : ${widthModules} modules = ${capacityMm} mm`,
    `Hauteur \u00e9tiquette : ${heightMm} mm`,
    `Fond : ${bgLabel}`,
    `Texte : ${textLabel}`,
  ].join(' \u00b7 ');
}

/**
 * Formate une valeur en millimetres avec son unite.
 * Si la valeur est entiere, pas de decimales. Sinon, deux decimales max.
 */
export function formatMm(value: number): string {
  if (Number.isInteger(value)) {
    return `${value} mm`;
  }
  return `${value.toFixed(2).replace(/\.?0+$/, '')} mm`;
}
