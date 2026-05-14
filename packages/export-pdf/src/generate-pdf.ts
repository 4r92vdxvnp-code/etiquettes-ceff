/**
 * Generateur principal du plan d'etiquetage PDF.
 *
 * Produit un document A3 paysage avec en-tete CEFF, plan technique cote de
 * chaque rangee, et gestion multi-page si le nombre de rangees depasse la
 * capacite d'une seule page.
 *
 * Regle anti tiret cadratin : tout texte passe par stripForbiddenDashes() avant
 * d'etre ecrit dans le PDF.
 */

import type { Project } from '@ceff/core';
import { A3_LANDSCAPE_MM, A3_MARGIN_MM, layoutProject, rowCapacityMm, stripForbiddenDashes } from '@ceff/core';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { CEFF_COLORS, CEFF_FONT_SIZES, mm, PDF_LAYOUT_MM } from './charte-tokens.js';
import { type DrawContext, drawText } from './draw-helpers.js';
import { drawHeader, drawSubHeader, embedLogo } from './header.js';
import { drawRow } from './row-renderer.js';
import { computePlanScale } from './scale.js';

/** Marge en bas de page pour le pied de page. */
const PAGE_BOTTOM_MARGIN_MM = A3_MARGIN_MM;

/**
 * Calcule le Y de depart du plan apres l'en-tete (logo + bandeaux).
 * Valeur identique pour la premiere page et les suivantes car drawSubHeader
 * utilise desormais la meme hauteur que drawHeader (zone logo incluse).
 */
function planStartY(): number {
  return (
    A3_MARGIN_MM +
    PDF_LAYOUT_MM.blueBannerHeight +
    PDF_LAYOUT_MM.redBannerHeight +
    PDF_LAYOUT_MM.headerToPlanGap
  );
}

/**
 * Repartit les index de rangees par page.
 *
 * @param firstPageStartY  Y de debut du plan sur la premiere page (apres en-tete).
 * @param subseqPageStartY Y de debut du plan sur les pages suivantes (apres sous-en-tete).
 * @param labelHeightMm    Hauteur de chaque etiquette.
 * @param rowCount         Nombre total de rangees.
 * @param pageBottomY      Y limite basse utilisable sur la page (en mm depuis le haut).
 * @returns Tableau de pages, chacune etant un tableau d'index de rangees.
 */
function calculateRowsPerPage(
  startY: number,
  labelHeightMm: number,
  rowCount: number,
  pageBottomY: number
): number[][] {
  const rowH =
    labelHeightMm +
    PDF_LAYOUT_MM.rowCotationZoneHeight +
    PDF_LAYOUT_MM.rowTotalCotationHeight;

  const pages: number[][] = [];
  let currentPage: number[] = [];
  let yMm = startY;

  for (let i = 0; i < rowCount; i++) {
    const rowBottom = yMm + rowH;
    // Si la rangee depasse la limite basse, on commence une nouvelle page
    if (rowBottom > pageBottomY && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      yMm = startY;
    }
    currentPage.push(i);
    yMm += rowH + PDF_LAYOUT_MM.rowGap;
  }

  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * Dessine le pied de page d'une page.
 *
 * @param ctx       Contexte de dessin.
 * @param affaire   Nom de l'affaire (filtre anti-tiret cadratin applique).
 * @param pageNum   Numero de la page (1-base).
 * @param pageTotal Nombre total de pages.
 */
function drawFooter(
  ctx: DrawContext,
  affaire: string,
  pageNum: number,
  pageTotal: number
): void {
  const yMm = A3_LANDSCAPE_MM.height - PAGE_BOTTOM_MARGIN_MM * 0.4;
  const pageWidthMm = A3_LANDSCAPE_MM.width;
  const margin = A3_MARGIN_MM;
  const gray = CEFF_COLORS.grisAnthracite.rgb;
  const fontSize = 7;

  // Gauche : nom de l'affaire
  drawText(ctx, margin, yMm, stripForbiddenDashes(affaire), {
    fontSize,
    color: gray,
    align: 'left',
  });

  // Centre : "Page X / Y"
  drawText(ctx, pageWidthMm / 2, yMm, `Page ${pageNum} / ${pageTotal}`, {
    fontSize,
    color: gray,
    align: 'center',
  });

  // Droite : mention contractuelle
  drawText(ctx, pageWidthMm - margin, yMm, 'Document non contractuel', {
    fontSize,
    color: gray,
    align: 'right',
  });
}

/**
 * Genere le plan d'etiquetage d'un projet en PDF (format A3 paysage).
 *
 * @param project   Projet valide. Appeler validateProject() en amont si la source est non maitrisee.
 * @param logoBytes Bytes optionnels d'un logo PNG ou JPEG a afficher dans la zone logo.
 * @returns Bytes du PDF prets a telecharger ou envoyer au graveur.
 */
export async function generatePdf(project: Project, logoBytes?: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Helvetica est la police standard la plus proche d'Arial disponible dans pdf-lib.
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidthPt = mm(A3_LANDSCAPE_MM.width);
  const pageHeightPt = mm(A3_LANDSCAPE_MM.height);
  const pageBottomY = A3_LANDSCAPE_MM.height - PAGE_BOTTOM_MARGIN_MM;

  // Logo embede une seule fois, reutilise sur toutes les pages
  const logo = logoBytes !== undefined ? await embedLogo(pdfDoc, logoBytes) : undefined;

  // Echelle du plan (identique pour toutes les pages)
  const tableWidthMm = rowCapacityMm(project);
  const scale = computePlanScale(tableWidthMm, A3_MARGIN_MM);
  const layout = layoutProject(project);

  // Repartition des rangees par page (calcul sans dessin)
  const rowsPerPage = calculateRowsPerPage(
    planStartY(),
    layout.labelHeightMm,
    layout.rows.length,
    pageBottomY
  );

  const totalPages = rowsPerPage.length;

  // Generation des pages
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    const ctx: DrawContext = {
      page,
      font,
      fontBold,
      pageHeightMm: A3_LANDSCAPE_MM.height,
    };

    let yMm: number;
    if (pageIdx === 0) {
      yMm = drawHeader(ctx, project, logo);
    } else {
      yMm = drawSubHeader(ctx, project, logo);
    }

    // Rangees de cette page
    const rowIndices = rowsPerPage[pageIdx] ?? [];
    for (const rowIdx of rowIndices) {
      const layoutRow = layout.rows[rowIdx];
      if (layoutRow === undefined) continue;
      const rowH = drawRow(ctx, layoutRow, layout.labelHeightMm, scale, yMm, project.bgColor, project.textColor, project.customBgColorHex, project.customTextColorHex);
      yMm += rowH + PDF_LAYOUT_MM.rowGap;
    }

    // Pied de page sur chaque page
    drawFooter(ctx, project.affaire, pageIdx + 1, totalPages);

    // Indication d'echelle reduite (sur la derniere page seulement)
    if (scale.reduced && pageIdx === totalPages - 1) {
      const footerExtraY = A3_LANDSCAPE_MM.height - PAGE_BOTTOM_MARGIN_MM * 0.9;
      const scaleStr = (1 / scale.factor).toFixed(2);
      const footerText = stripForbiddenDashes(`Echelle 1:${scaleStr} (facteur ${scale.factor.toFixed(2)})`);
      drawText(ctx, A3_LANDSCAPE_MM.width / 2, footerExtraY, footerText, {
        fontSize: CEFF_FONT_SIZES.coteCompacte - 1,
        align: 'center',
        color: CEFF_COLORS.grisAnthracite.rgb,
      });
    }
  }

  // useObjectStreams:false garantit la compatibilite avec les lecteurs qui ne
  // supportent pas les cross-reference streams compresses (dont pdf-parse v1).
  return pdfDoc.save({ useObjectStreams: false });
}
