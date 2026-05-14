/**
 * Dessin de l'en-tete CEFF sur la page A3 paysage.
 *
 * Structure : zone logo a gauche | bandeau bleu marine | bandeau rouge cramoisi
 * (empiles verticalement pour les bandeaux, logo sur toute la hauteur).
 */

import type { PDFDocument, PDFImage } from 'pdf-lib';
import type { Project } from '@ceff/core';
import { A3_MARGIN_MM, rowCapacityMm, stripForbiddenDashes } from '@ceff/core';
import { blueBannerLabel, redBannerLabel } from '@ceff/core';
import { CEFF_COLORS, CEFF_FONT_SIZES, MM_TO_PT, PDF_LAYOUT_MM } from './charte-tokens.js';
import { type DrawContext, drawText, fillRect } from './draw-helpers.js';

/**
 * Detecte le type d'image a partir des premiers octets du buffer.
 * Retourne 'png', 'jpg', ou null si non reconnu.
 */
function detectImageType(bytes: Uint8Array): 'png' | 'jpg' | null {
  if (bytes.length < 4) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpg';
  }
  return null;
}

/**
 * Embeds logo bytes into the PDF document once and returns the PDFImage.
 * Returns undefined if the bytes are invalid or unrecognized.
 */
export async function embedLogo(
  pdfDoc: PDFDocument,
  logoBytes: Uint8Array
): Promise<PDFImage | undefined> {
  if (logoBytes.length === 0) return undefined;
  const imageType = detectImageType(logoBytes);
  if (imageType === null) return undefined;
  try {
    return imageType === 'png'
      ? await pdfDoc.embedPng(logoBytes)
      : await pdfDoc.embedJpg(logoBytes);
  } catch {
    return undefined;
  }
}

/** Dessine le logo dans la zone logo. */
function drawLogoZone(
  ctx: DrawContext,
  margin: number,
  logoZoneW: number,
  headerH: number,
  logo: PDFImage | undefined
): void {
  if (logo !== undefined) {
    const logoPaddingMm = 2;
    const availW = logoZoneW - logoPaddingMm * 2;
    const availH = headerH - logoPaddingMm * 2;
    const imgRatio = logo.width / logo.height;
    const zoneRatio = availW / availH;

    let drawW: number;
    let drawH: number;
    if (imgRatio > zoneRatio) {
      drawW = availW;
      drawH = availW / imgRatio;
    } else {
      drawH = availH;
      drawW = availH * imgRatio;
    }

    const imgX = margin + (logoZoneW - drawW) / 2;
    const imgY = margin + (headerH - drawH) / 2;

    fillRect(ctx, margin, margin, logoZoneW, headerH, CEFF_COLORS.blanc.rgb);
    ctx.page.drawImage(logo, {
      x: imgX * MM_TO_PT,
      y: (ctx.pageHeightMm - imgY - drawH) * MM_TO_PT,
      width: drawW * MM_TO_PT,
      height: drawH * MM_TO_PT,
    });
  } else {
    drawFallbackLogo(ctx, margin, logoZoneW, headerH);
  }
}

/** Rectangle gris anthracite avec texte "CEFF" en fallback logo. */
function drawFallbackLogo(
  ctx: DrawContext,
  margin: number,
  logoZoneW: number,
  headerH: number
): void {
  fillRect(ctx, margin, margin, logoZoneW, headerH, CEFF_COLORS.grisAnthracite.rgb);
  drawText(ctx, margin + logoZoneW / 2, margin + headerH * 0.6, 'CEFF', {
    fontSize: CEFF_FONT_SIZES.titre3,
    color: CEFF_COLORS.blanc.rgb,
    bold: true,
    align: 'center',
  });
}

/** Dessine les deux bandeaux (bleu + rouge) a partir de bannerX. */
function drawBanners(
  ctx: DrawContext,
  project: Project,
  bannerX: number,
  margin: number,
  bannerW: number
): void {
  const blueBannerH = PDF_LAYOUT_MM.blueBannerHeight;
  const redBannerH = PDF_LAYOUT_MM.redBannerHeight;
  const padding = PDF_LAYOUT_MM.bannerPadding;

  fillRect(ctx, bannerX, margin, bannerW, blueBannerH, CEFF_COLORS.bleuMarine.rgb);
  drawText(
    ctx,
    bannerX + padding,
    margin + blueBannerH * 0.68,
    stripForbiddenDashes(blueBannerLabel(project.affaire)),
    {
      fontSize: CEFF_FONT_SIZES.titre2,
      color: CEFF_COLORS.blanc.rgb,
      bold: true,
    }
  );

  const capacityMm = rowCapacityMm(project);
  fillRect(ctx, bannerX, margin + blueBannerH, bannerW, redBannerH, CEFF_COLORS.rougeCramoisi.rgb);
  drawText(
    ctx,
    bannerX + padding,
    margin + blueBannerH + redBannerH * 0.68,
    stripForbiddenDashes(
      redBannerLabel({
        widthModules: project.widthModules,
        capacityMm,
        heightMm: project.heightMm,
        bgColor: project.bgColor,
        textColor: project.textColor,
        customBgColorHex: project.customBgColorHex,
        customTextColorHex: project.customTextColorHex,
      })
    ),
    {
      fontSize: CEFF_FONT_SIZES.corps,
      color: CEFF_COLORS.blanc.rgb,
      bold: true,
    }
  );
}

/**
 * Dessine l'en-tete complet (logo + bandeau bleu + bandeau rouge) en haut de la page.
 *
 * @param ctx    Contexte de dessin courant.
 * @param project Projet a afficher dans les bandeaux.
 * @param logo   Image logo deja embarquee (via embedLogo), ou undefined pour fallback.
 * @returns Position y (depuis le haut) apres l'en-tete, prete pour le debut du plan.
 */
export function drawHeader(
  ctx: DrawContext,
  project: Project,
  logo?: PDFImage
): number {
  const margin = A3_MARGIN_MM;
  const pageWidthMm = ctx.page.getWidth() / MM_TO_PT;

  const logoZoneW = PDF_LAYOUT_MM.logoZoneWidth;
  const blueBannerH = PDF_LAYOUT_MM.blueBannerHeight;
  const redBannerH = PDF_LAYOUT_MM.redBannerHeight;
  const headerH = blueBannerH + redBannerH;
  const bannerX = margin + logoZoneW;
  const bannerW = pageWidthMm - margin - bannerX;

  drawLogoZone(ctx, margin, logoZoneW, headerH, logo);
  drawBanners(ctx, project, bannerX, margin, bannerW);

  return margin + headerH + PDF_LAYOUT_MM.headerToPlanGap;
}

/**
 * Dessine le sous-en-tete (logo + bandeaux) pour les pages suivantes dans un PDF multi-page.
 *
 * @param logo   Image logo deja embarquee (via embedLogo), affichee sur toutes les pages.
 * @returns Position y (depuis le haut) apres le sous-en-tete.
 */
export function drawSubHeader(
  ctx: DrawContext,
  project: Project,
  logo?: PDFImage
): number {
  const margin = A3_MARGIN_MM;
  const pageWidthMm = ctx.page.getWidth() / MM_TO_PT;

  const logoZoneW = PDF_LAYOUT_MM.logoZoneWidth;
  const blueBannerH = PDF_LAYOUT_MM.blueBannerHeight;
  const redBannerH = PDF_LAYOUT_MM.redBannerHeight;
  const headerH = blueBannerH + redBannerH;

  const bannerX = margin + logoZoneW;
  const bannerW = pageWidthMm - margin - bannerX;

  drawLogoZone(ctx, margin, logoZoneW, headerH, logo);
  drawBanners(ctx, project, bannerX, margin, bannerW);

  return margin + headerH + PDF_LAYOUT_MM.headerToPlanGap;
}
