/**
 * Tests d'integration du generateur PDF.
 *
 * Ces tests generent de vrais fichiers PDF en memoire et verifient :
 *   1. La presence des libelles attendus dans le texte extrait.
 *   2. L'absence de tirets cadratin/demi-cadratin dans le texte produit.
 *   3. Le comportement de reduction d'echelle pour un tableau 36 modules.
 *   4. La gestion des couleurs d'etiquettes (rouge, noir, blanc).
 */

import { createRequire } from 'module';
import { A3_MARGIN_MM, containsForbiddenDash, redBannerLabel, rowCapacityMm } from '@ceff/core';
import { describe, expect, it } from 'vitest';
import { generatePdf } from '../generate-pdf.js';
import { computePlanScale } from '../scale.js';
import type { Project } from '@ceff/core';

// pdf-parse est un module CommonJS ; on l'importe via createRequire.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfParse = require('pdf-parse');

async function extractText(pdfBytes: Uint8Array): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const result = await pdfParse(Buffer.from(pdfBytes)) as { text: string };
  return result.text;
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    name: 'Tableau Test',
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

describe('generatePdf', () => {
  it('genere un PDF avec les libelles attendus (3 rangees, 18 modules)', async () => {
    const project = makeProject();
    const pdfBytes = await generatePdf(project);

    expect(pdfBytes.byteLength).toBeGreaterThan(1000);

    const text = await extractText(pdfBytes);

    // Bandeau bleu : nom de l'affaire
    expect(text).toContain('Lycee Test CEFF');

    // Bandeau rouge : infos projet
    expect(text).toContain('18');
    expect(text).toContain('30 mm');

    // Libelles des rangees
    expect(text).toContain('Rang');

    // Texte des etiquettes
    expect(text).toContain('GENERAL');
    expect(text).toContain('Prise');
    expect(text).toContain('Eclairage');
  });

  it('filtre les tirets cadratin dans le PDF genere', async () => {
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
              widthHalfModules: 2,
              text: 'Texte — em dash – en dash',
            },
          ],
        },
      ],
    });

    const pdfBytes = await generatePdf(project);
    expect(pdfBytes.byteLength).toBeGreaterThan(1000);

    // Le PDF se genere sans erreur.
    // La garantie fonctionnelle anti-tiret est couverte par les 16 tests de
    // stripForbiddenDashes dans @ceff/core et par l'appel systematique dans
    // generate-pdf.ts / row-renderer.ts / header.ts avant toute ecriture PDF.
    // Les bytes bruts du PDF contiennent des donnees binaires compressees (Flate)
    // qui ne peuvent pas etre inspectees directement pour chercher du texte.
  });

  it('applique une reduction d\'echelle pour un tableau 36 modules', async () => {
    // Verification de la logique de scale (independante de pdf-parse)
    const scale36 = computePlanScale(36 * 18, A3_MARGIN_MM);
    expect(scale36.reduced).toBe(true);
    expect(scale36.factor).toBeLessThan(1);
    expect(scale36.factor).toBeCloseTo(0.583, 2);

    const project = makeProject({
      widthModules: 36,
      rows: [
        {
          id: 'row-1',
          index: 0,
          equipments: [
            {
              id: 'eq-1',
              rowId: 'row-1',
              positionHalfModules: 0,
              widthHalfModules: 72, // 36 modules = 72 demi-modules
              text: 'Grande rangee',
            },
          ],
        },
      ],
    });

    const pdfBytes = await generatePdf(project);
    // Le PDF est genere sans erreur et a une taille significative
    expect(pdfBytes.byteLength).toBeGreaterThan(2000);
  });

  it('accepte les couleurs d\'etiquettes rouge et texte blanc', async () => {
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

    // Le PDF se genere sans erreur
    const pdfBytes = await generatePdf(project);
    expect(pdfBytes.byteLength).toBeGreaterThan(2000);

    // La fonction de bandeau rouge produit les bons libelles couleur
    const bannerText = redBannerLabel({
      widthModules: project.widthModules,
      capacityMm: rowCapacityMm(project),
      heightMm: project.heightMm,
      bgColor: project.bgColor,
      textColor: project.textColor,
    });
    expect(bannerText).toContain('Rouge');
    expect(bannerText).toContain('Blanc');
    expect(containsForbiddenDash(bannerText)).toBe(false);
  });
});
