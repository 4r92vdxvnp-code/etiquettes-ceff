/**
 * Primitives de dessin pour le PDF d'etiquetage.
 *
 * Toutes les coordonnees sont en millimetres. La conversion en points PDF est
 * faite par les fonctions mm() au moment de l'appel a pdf-lib.
 *
 * Convention de coordonnees : pdf-lib place l'origine en bas a gauche de la page.
 * Pour faciliter le raisonnement (lecture habituelle de haut en bas), on expose
 * des helpers qui prennent un yFromTop et calculent automatiquement l'origine.
 */

import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import { CEFF_COLORS, mm, PDF_LAYOUT_MM } from './charte-tokens.js';

export interface DrawContext {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  /** Hauteur totale de la page en mm (pour conversion yFromTop -> pdf-lib). */
  pageHeightMm: number;
}

/** Convertit une coordonnee y "depuis le haut de la page" en y pdf-lib. */
function yFromTop(ctx: DrawContext, yMm: number): number {
  return mm(ctx.pageHeightMm - yMm);
}

/**
 * Dessine un rectangle avec contour mais sans fond.
 *
 * Utilise pour les rectangles d'etiquettes (fond gere separement par fillRect).
 */
export function strokeRect(
  ctx: DrawContext,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  color: RGB = CEFF_COLORS.noir.rgb,
  strokeWidth: number = PDF_LAYOUT_MM.labelStrokeWidth
): void {
  ctx.page.drawRectangle({
    x: mm(xMm),
    y: yFromTop(ctx, yMm + heightMm),
    width: mm(widthMm),
    height: mm(heightMm),
    borderColor: color,
    borderWidth: mm(strokeWidth),
  });
}

/**
 * Dessine un rectangle plein (sans contour explicite).
 * Utilise pour les bandeaux d'entete colores.
 */
export function fillRect(
  ctx: DrawContext,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  fillColor: RGB
): void {
  ctx.page.drawRectangle({
    x: mm(xMm),
    y: yFromTop(ctx, yMm + heightMm),
    width: mm(widthMm),
    height: mm(heightMm),
    color: fillColor,
  });
}

/**
 * Dessine un rectangle avec fond et contour (cas des etiquettes colorees :
 * fond rouge ou noir avec bordure noire fine).
 */
export function fillStrokeRect(
  ctx: DrawContext,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  fillColor: RGB,
  strokeColor: RGB = CEFF_COLORS.noir.rgb,
  strokeWidth: number = PDF_LAYOUT_MM.labelStrokeWidth
): void {
  ctx.page.drawRectangle({
    x: mm(xMm),
    y: yFromTop(ctx, yMm + heightMm),
    width: mm(widthMm),
    height: mm(heightMm),
    color: fillColor,
    borderColor: strokeColor,
    borderWidth: mm(strokeWidth),
  });
}

/**
 * Dessine une ligne droite entre deux points (en mm depuis le coin haut-gauche).
 */
export function drawLine(
  ctx: DrawContext,
  x1Mm: number,
  y1Mm: number,
  x2Mm: number,
  y2Mm: number,
  color: RGB = CEFF_COLORS.noir.rgb,
  thickness: number = PDF_LAYOUT_MM.cotationStrokeWidth,
  dashArray?: [number, number]
): void {
  ctx.page.drawLine({
    start: { x: mm(x1Mm), y: yFromTop(ctx, y1Mm) },
    end: { x: mm(x2Mm), y: yFromTop(ctx, y2Mm) },
    thickness: mm(thickness),
    color,
    ...(dashArray ? { dashArray: dashArray.map((v) => mm(v)) } : {}),
  });
}

/**
 * Dessine une tete de fleche en "V" avec deux traits, orientee vers la gauche
 * ou vers la droite (les cotes sont toujours horizontales).
 *
 * Utilise drawLine (fiable) plutot que drawSvgPath (rendu instable selon les viewers).
 *
 * @param tipXMm  Position de la pointe.
 * @param tipYMm  Position verticale de la pointe.
 * @param direction "left" ou "right" indique vers ou pointe la fleche.
 */
export function drawArrowHead(
  ctx: DrawContext,
  tipXMm: number,
  tipYMm: number,
  direction: 'left' | 'right',
  color: RGB = CEFF_COLORS.noir.rgb,
  size: number = PDF_LAYOUT_MM.arrowSize
): void {
  // dx : direction vers laquelle s'ouvre le "V" (oppose a la pointe)
  const dx = direction === 'left' ? size : -size;
  const halfH = size * 0.45;
  const sw = PDF_LAYOUT_MM.cotationStrokeWidth * 1.8;

  drawLine(ctx, tipXMm, tipYMm, tipXMm + dx, tipYMm - halfH, color, sw);
  drawLine(ctx, tipXMm, tipYMm, tipXMm + dx, tipYMm + halfH, color, sw);
}

/**
 * Dessine une cote complete : ligne horizontale entre deux points avec une
 * fleche a chaque extremite.
 */
export function drawCotation(
  ctx: DrawContext,
  xStartMm: number,
  xEndMm: number,
  yMm: number,
  color: RGB = CEFF_COLORS.noir.rgb,
  thickness: number = PDF_LAYOUT_MM.cotationStrokeWidth,
  dashed: boolean = false
): void {
  drawLine(
    ctx,
    xStartMm,
    yMm,
    xEndMm,
    yMm,
    color,
    thickness,
    dashed ? [1.2, 0.8] : undefined
  );
  drawArrowHead(ctx, xStartMm, yMm, 'left', color);
  drawArrowHead(ctx, xEndMm, yMm, 'right', color);
}

export type TextAlign = 'left' | 'center' | 'right';

/**
 * Dessine un texte avec alignement et couleur. Le texte peut etre multi-lignes
 * (separees par '\n'), chaque ligne est positionnee sous la precedente avec un
 * interligne de 1.15.
 *
 * @param xMm Position horizontale du point d'ancrage.
 * @param yMm Position verticale de la baseline de la PREMIERE ligne.
 * @param text Texte a dessiner.
 * @param align Alignement par rapport au point d'ancrage.
 */
export function drawText(
  ctx: DrawContext,
  xMm: number,
  yMm: number,
  text: string,
  options: {
    font?: PDFFont;
    fontSize?: number;
    color?: RGB;
    align?: TextAlign;
    bold?: boolean;
  } = {}
): void {
  const font = options.font ?? (options.bold ? ctx.fontBold : ctx.font);
  const fontSize = options.fontSize ?? 11;
  const color = options.color ?? CEFF_COLORS.noir.rgb;
  const align = options.align ?? 'left';

  const lines = text.split('\n');
  const lineHeightMm = (fontSize / 72) * 25.4 * 1.15;

  lines.forEach((line, idx) => {
    const lineWidth = font.widthOfTextAtSize(line, fontSize);
    const lineWidthMm = lineWidth / (72 / 25.4);

    let drawX: number;
    if (align === 'center') {
      drawX = mm(xMm) - lineWidth / 2;
    } else if (align === 'right') {
      drawX = mm(xMm) - lineWidth;
    } else {
      drawX = mm(xMm);
    }

    const drawY = yFromTop(ctx, yMm + idx * lineHeightMm);

    ctx.page.drawText(line, {
      x: drawX,
      y: drawY,
      size: fontSize,
      font,
      color,
    });

    // Le warning lineWidthMm n'est utilise que pour le debug, no-op
    void lineWidthMm;
  });
}

/**
 * Mesure la largeur d'un texte en millimetres (la plus longue ligne en cas de multi-lignes).
 */
export function measureTextWidth(
  font: PDFFont,
  text: string,
  fontSize: number
): number {
  const widths = text.split('\n').map((line) => font.widthOfTextAtSize(line, fontSize));
  const maxWidth = Math.max(...widths, 0);
  return maxWidth / (72 / 25.4);
}

/**
 * Dessine un texte centre dans un rectangle, sur plusieurs lignes si necessaire,
 * avec reduction automatique de la taille de police si le texte ne tient pas.
 *
 * Utilise pour dessiner le contenu d'une etiquette : le texte doit toujours
 * tenir, quitte a reduire la police.
 */
export function drawTextInBox(
  ctx: DrawContext,
  boxXMm: number,
  boxYMm: number,
  boxWidthMm: number,
  boxHeightMm: number,
  text: string,
  options: {
    color?: RGB;
    bold?: boolean;
    initialFontSize?: number;
    minFontSize?: number;
    paddingMm?: number;
  } = {}
): void {
  const padding = options.paddingMm ?? 0.5;
  const minSize = options.minFontSize ?? 5;
  const initialSize = options.initialFontSize ?? 9;
  const font = options.bold ? ctx.fontBold : ctx.font;

  const lines = text.split('\n');
  const availableWidth = boxWidthMm - 2 * padding;
  const availableHeight = boxHeightMm - 2 * padding;

  // Recherche dichotomique de la plus grande taille qui rentre
  let fontSize = initialSize;
  while (fontSize >= minSize) {
    const lineHeightMm = (fontSize / 72) * 25.4 * 1.15;
    const totalHeight = lines.length * lineHeightMm;

    const widths = lines.map((line) => {
      const w = font.widthOfTextAtSize(line, fontSize);
      return w / (72 / 25.4);
    });
    const maxLineWidth = Math.max(...widths, 0);

    if (totalHeight <= availableHeight && maxLineWidth <= availableWidth) {
      break;
    }
    fontSize -= 0.5;
  }

  // Centrage vertical
  const lineHeightMm = (fontSize / 72) * 25.4 * 1.15;
  const totalHeight = lines.length * lineHeightMm;
  const verticalOffset = (boxHeightMm - totalHeight) / 2;
  // Baseline de la premiere ligne : haut de la box + offset + (lineHeight - hauteur du texte sans descente) / 2
  // En pratique on positionne la baseline a peu pres aux 80% de la lineHeight
  const firstLineBaseline = boxYMm + verticalOffset + lineHeightMm * 0.8;

  drawText(ctx, boxXMm + boxWidthMm / 2, firstLineBaseline, text, {
    font,
    fontSize,
    align: 'center',
    ...(options.color !== undefined ? { color: options.color } : {}),
  });
}
