/**
 * Generateur principal du fichier Excel d'etiquetage.
 *
 * Produit un fichier .xlsx avec une feuille "Etiquettes" contenant :
 *   - Un bloc d'en-tete aux couleurs CEFF (bandeau bleu + bandeau rouge).
 *   - Un tableau de donnees : une ligne par equipement, avec position, largeur,
 *     hauteur, texte (3 colonnes pour les 3 lignes possibles) et codes couleur.
 *   - Les cellules de texte d'etiquette coloriees avec les vraies couleurs
 *     fond/texte du projet, pour que le graveur visualise le rendu.
 *
 * Regle anti tiret cadratin : tout texte passe par stripForbiddenDashes()
 * avant d'etre ecrit dans une cellule.
 */

import type { Project } from '@ceff/core';
import {
  containsForbiddenDash,
  effectiveColorHex,
  layoutProject,
  rowCapacityMm,
  rowLabel,
  stripForbiddenDashes,
} from '@ceff/core';
import ExcelJS from 'exceljs';

// Couleurs CEFF en format ARGB (ExcelJS)
const ARGB_CEFF_BLUE = 'FF1F3864';
const ARGB_CEFF_RED = 'FF9B2020';
const ARGB_WHITE = 'FFFFFFFF';
const ARGB_LIGHT_GRAY = 'FFD9D9D9';
const ARGB_BLACK = 'FF000000';

/** Convertit un hex #RRGGBB en FFRRGGBB pour ExcelJS. */
function hexToArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

/**
 * Verifie qu'une cellule texte ne contient aucun tiret cadratin.
 * Leve une erreur si c'est le cas : cela indique un oubli d'appel a stripForbiddenDashes.
 */
function assertNoDash(value: string): void {
  if (containsForbiddenDash(value)) {
    throw new Error(`Tiret cadratin detecte dans la cellule : "${value}"`);
  }
}

/** Ecrit une valeur texte filtree dans une cellule. */
function setCellText(cell: ExcelJS.Cell, raw: string): void {
  const safe = stripForbiddenDashes(raw);
  assertNoDash(safe);
  cell.value = safe;
}

/** Applique le style d'en-tete (bandeau bleu ou rouge). */
function styleHeader(cell: ExcelJS.Cell, bgArgb: string, size: number): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.font = { name: 'Arial', bold: true, size, color: { argb: ARGB_WHITE } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
}

/** Applique le style d'en-tete de colonne (fond gris). */
function styleColumnHeader(cell: ExcelJS.Cell): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_LIGHT_GRAY } };
  cell.font = { name: 'Arial', bold: true, size: 9, color: { argb: ARGB_BLACK } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  cell.border = { bottom: { style: 'medium', color: { argb: ARGB_BLACK } } };
}

/** Applique le style aux cellules de texte d'etiquette (couleurs reelles). */
function styleEtiquetteCell(cell: ExcelJS.Cell, bgArgb: string, textArgb: string): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.font = { name: 'Arial', bold: false, size: 9, color: { argb: textArgb } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
}

/** Applique le style aux cellules de donnees standard. */
function styleDataCell(cell: ExcelJS.Cell): void {
  cell.font = { name: 'Arial', size: 9 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

const TOTAL_COLS = 10;

/**
 * Genere le fichier Excel d'etiquetage d'un projet.
 *
 * @param project Projet valide. Appeler validateProject() en amont si la source est non maitrisee.
 * @returns Bytes du fichier .xlsx prets a telecharger.
 */
export async function generateExcel(project: Project): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CEFF Etiquetage';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Etiquettes');

  const layout = layoutProject(project);
  const capacityMm = rowCapacityMm(project);
  const bgHex = effectiveColorHex(project.bgColor, project.customBgColorHex);
  const textHex = effectiveColorHex(project.textColor, project.customTextColorHex);
  const bgArgb = hexToArgb(bgHex);
  const textArgb = hexToArgb(textHex);

  // --- Ligne 1 : bandeau bleu ---
  const blueBanner = stripForbiddenDashes(
    `ETIQUETAGE TABLEAU MODULAIRE - Affaire : ${project.affaire}`
  );
  const row1 = ws.addRow([blueBanner]);
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  styleHeader(ws.getCell(1, 1), ARGB_CEFF_BLUE, 14);
  row1.height = 28;

  // --- Ligne 2 : bandeau rouge ---
  const redBanner = stripForbiddenDashes(
    `Capacite : ${project.widthModules} modules = ${capacityMm} mm` +
    ` - Hauteur etiquette : ${project.heightMm} mm` +
    ` - Fond : ${bgHex} - Texte : ${textHex}`
  );
  const row2 = ws.addRow([redBanner]);
  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  styleHeader(ws.getCell(2, 1), ARGB_CEFF_RED, 11);
  row2.height = 20;

  // --- Ligne 3 : vide ---
  ws.addRow([]);

  // --- Ligne 4 : en-tetes de colonnes ---
  const headers = [
    'Rangee',
    'N° Et.',
    'Position (mm)',
    'Largeur (mm)',
    'Hauteur (mm)',
    'Ligne 1',
    'Ligne 2',
    'Ligne 3',
    'Fond (hex)',
    'Texte (hex)',
  ];
  const headerRow = ws.addRow(headers);
  headerRow.height = 18;
  for (let col = 1; col <= TOTAL_COLS; col++) {
    styleColumnHeader(headerRow.getCell(col));
  }

  // --- Lignes de donnees : un equipement par ligne ---
  let eqNum = 1;
  for (const layoutRow of layout.rows) {
    const rangeeLabel = stripForbiddenDashes(rowLabel(layoutRow.index));

    for (const cell of layoutRow.cells) {
      if (cell.type !== 'equipment') continue;

      const rawText = stripForbiddenDashes(cell.text);
      const lines = rawText.split('\n');
      const ligne1 = lines[0] ?? '';
      const ligne2 = lines[1] ?? '';
      const ligne3 = lines[2] ?? '';

      const dataRow = ws.addRow([
        rangeeLabel,
        eqNum,
        cell.leftMm,
        cell.widthMm,
        project.heightMm,
        ligne1,
        ligne2,
        ligne3,
        bgHex,
        textHex,
      ]);
      dataRow.height = 16;
      eqNum++;

      // Colonnes de donnees standard (A a E, I, J)
      for (const col of [1, 2, 3, 4, 5, 9, 10]) {
        styleDataCell(dataRow.getCell(col));
      }

      // Colonnes de texte d'etiquette coloriees (F, G, H = cols 6, 7, 8)
      for (const col of [6, 7, 8]) {
        styleEtiquetteCell(dataRow.getCell(col), bgArgb, textArgb);
      }
    }
  }

  // --- Largeurs des colonnes ---
  ws.getColumn(1).width = 12;   // Rangee
  ws.getColumn(2).width = 7;    // N° Et.
  ws.getColumn(3).width = 14;   // Position
  ws.getColumn(4).width = 14;   // Largeur
  ws.getColumn(5).width = 14;   // Hauteur
  ws.getColumn(6).width = 20;   // Ligne 1
  ws.getColumn(7).width = 20;   // Ligne 2
  ws.getColumn(8).width = 20;   // Ligne 3
  ws.getColumn(9).width = 12;   // Fond
  ws.getColumn(10).width = 12;  // Texte

  // Fige les 4 premieres lignes (en-tetes)
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
