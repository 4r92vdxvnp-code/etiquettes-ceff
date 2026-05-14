/**
 * Tests d'integration du generateur Excel.
 *
 * Ces tests generent de vrais fichiers .xlsx en memoire et verifient :
 *   1. La presence des libelles attendus dans la feuille "Etiquettes".
 *   2. L'absence de tirets cadratin/demi-cadratin dans toutes les cellules.
 *   3. Les couleurs de fond et de texte des cellules d'etiquette.
 *   4. La coherence des donnees dimensionnelles (position, largeur, hauteur).
 */

import type { Project } from '@ceff/core';
import { containsForbiddenDash } from '@ceff/core';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { generateExcel } from '../generate-excel.js';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-excel',
    name: 'Tableau Excel Test',
    affaire: 'Lycee Test CEFF',
    widthModules: 18,
    heightMm: 30,
    bgColor: 'blanc',
    textColor: 'noir',
    createdAt: 1000000,
    updatedAt: 1000000,
    schemaVersion: 1,
    rows: [
      {
        id: 'row-1',
        index: 0,
        equipments: [
          {
            id: 'eq-1',
            rowId: 'row-1',
            positionHalfModules: 0,
            widthHalfModules: 4,
            text: 'GENERAL',
          },
          {
            id: 'eq-2',
            rowId: 'row-1',
            positionHalfModules: 4,
            widthHalfModules: 2,
            text: 'Prise',
          },
          {
            id: 'eq-3',
            rowId: 'row-1',
            positionHalfModules: 8,
            widthHalfModules: 4,
            text: 'Eclairage\nRDC',
          },
        ],
      },
      {
        id: 'row-2',
        index: 1,
        equipments: [
          {
            id: 'eq-4',
            rowId: 'row-2',
            positionHalfModules: 0,
            widthHalfModules: 6,
            text: 'VMC',
          },
        ],
      },
      {
        id: 'row-3',
        index: 2,
        equipments: [
          {
            id: 'eq-5',
            rowId: 'row-3',
            positionHalfModules: 0,
            widthHalfModules: 2,
            text: 'Chaudiere',
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Relit un fichier Excel depuis ses bytes et retourne le workbook. */
async function loadWorkbook(bytes: Uint8Array): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes));
  return wb;
}

/** Extrait toutes les valeurs texte d'une feuille sous forme de tableau aplati. */
function extractAllCellValues(ws: ExcelJS.Worksheet): string[] {
  const values: string[] = [];
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      const v = cell.value;
      if (typeof v === 'string' && v.length > 0) values.push(v);
      if (typeof v === 'number') values.push(String(v));
    });
  });
  return values;
}

describe('generateExcel', () => {
  it('genere un Excel avec les libelles attendus (3 rangees, 18 modules)', async () => {
    const project = makeProject();
    const bytes = await generateExcel(project);

    expect(bytes.byteLength).toBeGreaterThan(1000);

    const wb = await loadWorkbook(bytes);
    const ws = wb.getWorksheet('Etiquettes');
    expect(ws).toBeDefined();

    const values = extractAllCellValues(ws!);
    const joined = values.join(' ');

    // En-tete : nom de l'affaire
    expect(joined).toContain('Lycee Test CEFF');

    // Dimensions du tableau
    expect(joined).toContain('18');
    expect(joined).toContain('30');

    // Textes des equipements
    expect(joined).toContain('GENERAL');
    expect(joined).toContain('Prise');
    expect(joined).toContain('Eclairage');
    expect(joined).toContain('VMC');
    expect(joined).toContain('Chaudiere');

    // Labels de rangees
    expect(joined).toContain('1');
    expect(joined).toContain('2');
    expect(joined).toContain('3');
  });

  it('filtre les tirets cadratin dans toutes les cellules', async () => {
    const project = makeProject({
      affaire: 'Affaire — Avec tiret cadratin',
      rows: [
        {
          id: 'row-1',
          index: 0,
          equipments: [
            {
              id: 'eq-1',
              rowId: 'row-1',
              positionHalfModules: 0,
              widthHalfModules: 4,
              text: 'Texte — em dash – en dash',
            },
          ],
        },
      ],
    });

    const bytes = await generateExcel(project);
    const wb = await loadWorkbook(bytes);
    const ws = wb.getWorksheet('Etiquettes');
    expect(ws).toBeDefined();

    // Aucune cellule ne doit contenir un tiret cadratin
    const values = extractAllCellValues(ws!);
    for (const v of values) {
      expect(containsForbiddenDash(v)).toBe(false);
    }

    // Les tirets cadratin ont ete remplaces par des traits d'union ASCII
    const joined = values.join(' ');
    expect(joined).toContain('Affaire - Avec tiret cadratin');
    expect(joined).toContain('Texte - em dash - en dash');
  });

  it('applique les couleurs rouge fond / blanc texte aux cellules d\'etiquette', async () => {
    const project = makeProject({
      bgColor: 'rouge',
      textColor: 'blanc',
      rows: [
        {
          id: 'row-1',
          index: 0,
          equipments: [
            {
              id: 'eq-1',
              rowId: 'row-1',
              positionHalfModules: 0,
              widthHalfModules: 4,
              text: 'DISJONCTEUR',
            },
          ],
        },
      ],
    });

    const bytes = await generateExcel(project);
    const wb = await loadWorkbook(bytes);
    const ws = wb.getWorksheet('Etiquettes');
    expect(ws).toBeDefined();

    // Cherche la premiere ligne de donnees (ligne 5 = apres 3 lignes d'en-tete + 1 separateur)
    // Les colonnes 6, 7, 8 (Ligne 1, 2, 3) doivent avoir le bon fond et la bonne couleur de texte
    let foundColoredCell = false;
    ws!.eachRow((row, rowNum) => {
      if (rowNum < 5) return;
      const ligne1Cell = row.getCell(6);
      const fill = ligne1Cell.fill;
      if (fill && fill.type === 'pattern' && fill.pattern === 'solid') {
        const fg = fill.fgColor?.argb ?? '';
        if (fg !== '') {
          // Fond rouge : #C00000 -> FFC00000
          expect(fg.toUpperCase()).toBe('FFC00000');
          foundColoredCell = true;
        }
      }
      const font = ligne1Cell.font;
      if (font?.color?.argb) {
        // Texte blanc : #FFFFFF -> FFFFFFFF
        expect(font.color.argb.toUpperCase()).toBe('FFFFFFFF');
      }
    });

    expect(foundColoredCell).toBe(true);

    // Les codes couleur hex sont aussi dans les colonnes I et J
    const values = extractAllCellValues(ws!);
    const joined = values.join(' ');
    expect(joined).toContain('#C00000');
    expect(joined).toContain('#FFFFFF');
  });

  it('exporte les donnees dimensionnelles correctes (position, largeur, hauteur)', async () => {
    const project = makeProject({
      heightMm: 15,
      widthModules: 12,
      rows: [
        {
          id: 'row-1',
          index: 0,
          equipments: [
            {
              id: 'eq-1',
              rowId: 'row-1',
              positionHalfModules: 0,
              widthHalfModules: 4,  // 4 * 9 = 36 mm, position = 0 mm
              text: 'A',
            },
            {
              id: 'eq-2',
              rowId: 'row-1',
              positionHalfModules: 4,
              widthHalfModules: 6,  // 6 * 9 = 54 mm, position = 36 mm
              text: 'B',
            },
          ],
        },
      ],
    });

    const bytes = await generateExcel(project);
    const wb = await loadWorkbook(bytes);
    const ws = wb.getWorksheet('Etiquettes');
    expect(ws).toBeDefined();

    const values = extractAllCellValues(ws!);
    const joined = values.join(' ');

    // Hauteur du projet
    expect(joined).toContain('15');

    // Positions en mm : 0 et 36 (4 * 9)
    expect(joined).toContain('0');
    expect(joined).toContain('36');

    // Largeurs en mm : 36 (4 * 9) et 54 (6 * 9)
    expect(joined).toContain('54');
  });
});
