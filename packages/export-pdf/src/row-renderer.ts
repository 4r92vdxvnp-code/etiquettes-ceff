/**
 * Dessin d'une rangee du plan technique d'etiquetage.
 *
 * Chaque rangee produit :
 *   - Un libelle "Rangee N" dans la colonne gauche
 *   - Des rectangles d'etiquettes colores pour les equipements
 *   - Des rectangles a contour pour les emplacements vides (gaps)
 *   - Des cotes individuelles sous chaque equipement (fleches double sens + valeur)
 *   - Une cote totale en pointille sur toute la largeur de la rangee
 */

import type { LabelColor, LayoutRow } from '@ceff/core';
import {
  rowLabel,
  rowTotalLengthLabel,
  stripForbiddenDashes,
} from '@ceff/core';
import { rgb } from 'pdf-lib';
import { CEFF_COLORS, CEFF_FONT_SIZES, PDF_LAYOUT_MM } from './charte-tokens.js';
import {
  type DrawContext,
  drawCotation,
  drawLine,
  drawText,
  drawTextInBox,
  fillStrokeRect,
  strokeRect,
} from './draw-helpers.js';
import { type PlanScale, tableWidthToPageWidth, tableXToPageX } from './scale.js';

/** Distance entre le bas de l'etiquette et le trait de cote. */
const COT_LINE_OFFSET_MM = 5.0;
/** Distance entre le trait de cote et la baseline du texte (texte sous le trait). */
const COT_TEXT_BELOW_MM = 4.0;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // Fallback au noir si le hex est malformé (parseInt retourne NaN)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return CEFF_COLORS.noir.rgb;
  return rgb(r, g, b);
}

function resolveColor(color: LabelColor, customHex?: string) {
  if (color === 'personnalise') return customHex ? hexToRgb(customHex) : CEFF_COLORS.noir.rgb;
  switch (color) {
    case 'rouge': return CEFF_COLORS.rougeAlerte.rgb;
    case 'noir':  return CEFF_COLORS.noir.rgb;
    case 'blanc': return CEFF_COLORS.blanc.rgb;
  }
}

/**
 * Dessine une rangee complete (rectangles + cotes).
 *
 * @param yMm       Coordonnee y du bord superieur des rectangles d'etiquettes.
 * @param bgColor   Couleur de fond des etiquettes (globale au projet).
 * @param textColor Couleur du texte des etiquettes (globale au projet).
 * @returns Hauteur totale consommee par la rangee (hors rowGap).
 */
export function drawRow(
  ctx: DrawContext,
  layoutRow: LayoutRow,
  labelHeightMm: number,
  scale: PlanScale,
  yMm: number,
  bgColor: LabelColor,
  textColor: LabelColor,
  customBgColorHex?: string,
  customTextColorHex?: string,
): number {
  const margin = scale.planLeftMm - PDF_LAYOUT_MM.rowLabelColumnWidth;
  const cotationZoneH = PDF_LAYOUT_MM.rowCotationZoneHeight;
  const totalCoteH = PDF_LAYOUT_MM.rowTotalCotationHeight;

  const labelBottom = yMm + labelHeightMm;
  // Trait de cote individuel : COT_LINE_OFFSET_MM sous le bas de l'etiquette
  const cotLineY = labelBottom + COT_LINE_OFFSET_MM;
  // Texte de cote : COT_TEXT_BELOW_MM sous le trait (texte en dessous, pas au-dessus)
  const cotTextY = cotLineY + COT_TEXT_BELOW_MM;
  // Ligne de cote totale : au centre de la zone totalCote
  const totalLineY = labelBottom + cotationZoneH + totalCoteH * 0.5;
  // Texte de cote totale : 3 mm au-dessus du trait pointille
  const totalTextY = totalLineY - 3.0;

  // --- Libelle "Rangee N" dans la colonne gauche ---
  drawText(
    ctx,
    margin + PDF_LAYOUT_MM.rowLabelColumnWidth / 2,
    yMm + labelHeightMm * 0.62,
    stripForbiddenDashes(rowLabel(layoutRow.index)),
    {
      fontSize: CEFF_FONT_SIZES.cote,
      bold: true,
      align: 'center',
    }
  );

  // --- Rectangles, cotations des cellules (equipements et espaces vides) ---
  for (const cell of layoutRow.cells) {
    const cellX = tableXToPageX(cell.leftMm, scale);
    const cellW = tableWidthToPageWidth(cell.widthMm, scale);

    if (cell.type === 'equipment') {
      // Rectangle colore de l'etiquette
      fillStrokeRect(
        ctx,
        cellX,
        yMm,
        cellW,
        labelHeightMm,
        resolveColor(bgColor, customBgColorHex),
        CEFF_COLORS.noir.rgb
      );

      // Texte dans l'etiquette
      if (cell.text.trim() !== '') {
        drawTextInBox(ctx, cellX, yMm, cellW, labelHeightMm, stripForbiddenDashes(cell.text), {
          color: resolveColor(textColor, customTextColorHex),
          bold: false,
          initialFontSize: CEFF_FONT_SIZES.cote,
          minFontSize: 4,
          paddingMm: 0.8,
        });
      }

      drawCellCotation(ctx, cellX, cellW, labelBottom, cotLineY, cotTextY, cell.widthMm, CEFF_COLORS.noir.rgb);
    } else {
      // Espace vide : contour pointille leger
      strokeRect(
        ctx,
        cellX,
        yMm,
        cellW,
        labelHeightMm,
        CEFF_COLORS.grisAnthracite.rgb,
        PDF_LAYOUT_MM.cotationStrokeWidth
      );

      // Cotation de l'espace vide (meme style, couleur gris)
      drawCellCotation(ctx, cellX, cellW, labelBottom, cotLineY, cotTextY, cell.widthMm, CEFF_COLORS.grisAnthracite.rgb);
    }
  }

  // --- Cote totale (trait pointille) ---
  const rowRightX = tableXToPageX(layoutRow.totalWidthMm, scale);
  drawCotation(ctx, scale.planLeftMm, rowRightX, totalLineY, CEFF_COLORS.noir.rgb, PDF_LAYOUT_MM.cotationStrokeWidth, true);
  drawText(
    ctx,
    scale.planLeftMm + (rowRightX - scale.planLeftMm) / 2,
    totalTextY,
    stripForbiddenDashes(rowTotalLengthLabel(layoutRow.totalWidthMm)),
    {
      fontSize: CEFF_FONT_SIZES.cote,
      align: 'center',
    }
  );

  return labelHeightMm + cotationZoneH + totalCoteH;
}

/**
 * Dessine le trait de cote avec fleches et le texte de dimension pour une cellule.
 *
 * Style minimaliste : trait horizontal avec fleches aux extremites de la cellule,
 * valeur en mm centree juste en dessous. Pas de traits de renvoi verticaux pour
 * eviter l'effet "boite" sur le plan.
 */
function drawCellCotation(
  ctx: DrawContext,
  cellX: number,
  cellW: number,
  _labelBottom: number,
  cotLineY: number,
  cotTextY: number,
  widthMm: number,
  color: typeof CEFF_COLORS.noir.rgb,
): void {
  const sw = PDF_LAYOUT_MM.cotationStrokeWidth;

  // Trait de cote avec fleches (pas de ticks verticaux)
  drawCotation(ctx, cellX, cellX + cellW, cotLineY, color, sw);

  // Valeur en mm centree SOUS le trait — police uniforme 8pt
  drawText(ctx, cellX + cellW / 2, cotTextY, `${widthMm} mm`, {
    fontSize: CEFF_FONT_SIZES.coteCompacte,
    color,
    align: 'center',
  });
}
