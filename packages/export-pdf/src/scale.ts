/**
 * Calcul de l'echelle d'affichage du plan technique sur une page A3 paysage.
 *
 * Probleme : un tableau 36 modules fait 648 mm de large physique. La zone
 * utile A3 paysage (apres marges) fait 400 mm. Il faut donc reduire le dessin
 * pour qu'il tienne sur la page.
 *
 * L'echelle s'applique uniquement au plan (rectangles d'etiquettes et leurs
 * cotes). Elle ne s'applique pas aux entetes (bandeaux bleu et rouge), qui
 * occupent toujours toute la largeur de la zone utile.
 */

import { A3_USABLE_MM } from '@ceff/core';
import { PDF_LAYOUT_MM } from './charte-tokens.js';

export interface PlanScale {
  /** Facteur d'echelle applique au plan (1 = echelle reelle). */
  factor: number;
  /** Largeur dessinee du plan en mm sur la page (apres echelle). */
  drawnWidthMm: number;
  /** Position x du debut de la zone de dessin du plan (apres colonne "Rangee X"). */
  planLeftMm: number;
  /** Indique si une reduction a ete appliquee (factor < 1). */
  reduced: boolean;
}

/**
 * Calcule l'echelle a appliquer pour que le tableau tienne sur la page A3 paysage.
 *
 * @param tableWidthMm Largeur reelle du tableau en mm (= widthModules * 18).
 * @param marginMm Marge peripherique de la page en mm.
 */
export function computePlanScale(
  tableWidthMm: number,
  marginMm: number
): PlanScale {
  // Largeur utile de la page = largeur A3 paysage - 2 marges
  const usableWidth = A3_USABLE_MM.width;
  // Zone disponible pour le plan = usable - colonne "Rangee X"
  const availableWidth = usableWidth - PDF_LAYOUT_MM.rowLabelColumnWidth;

  const factor = tableWidthMm <= availableWidth ? 1 : availableWidth / tableWidthMm;
  const drawnWidth = tableWidthMm * factor;
  const planLeft = marginMm + PDF_LAYOUT_MM.rowLabelColumnWidth;

  return {
    factor,
    drawnWidthMm: drawnWidth,
    planLeftMm: planLeft,
    reduced: factor < 1,
  };
}

/**
 * Convertit une coordonnee X "tableau reel" (en mm a l'echelle 1:1) en
 * coordonnee X "page" (en mm sur la page apres echelle).
 */
export function tableXToPageX(tableXMm: number, scale: PlanScale): number {
  return scale.planLeftMm + tableXMm * scale.factor;
}

/**
 * Convertit une largeur "tableau reel" en largeur "page" apres echelle.
 */
export function tableWidthToPageWidth(widthMm: number, scale: PlanScale): number {
  return widthMm * scale.factor;
}
