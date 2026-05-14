import { describe, expect, it } from 'vitest';
import type { Equipment, Project, Row } from '../types/project.js';
import {
  validateColorPair,
  validateEquipment,
  validateEquipmentText,
  validateLabelHeight,
  validateNoOverlap,
  validateProject,
  validateRowCount,
  validateTableWidth,
} from '../validation/validators.js';

// --- Helpers de construction ---

function makeEq(opts: Partial<Equipment> = {}): Equipment {
  return {
    id: opts.id ?? 'eq1',
    rowId: opts.rowId ?? 'row1',
    positionHalfModules: opts.positionHalfModules ?? 0,
    widthHalfModules: opts.widthHalfModules ?? 4,
    text: opts.text ?? 'TEST',
    ...(opts.widthMm !== undefined ? { widthMm: opts.widthMm } : {}),
  };
}

function makeRow(opts: Partial<Row> & { equipments?: Equipment[] } = {}): Row {
  return {
    id: opts.id ?? 'row1',
    index: opts.index ?? 0,
    equipments: opts.equipments ?? [],
  };
}

function makeProject(opts: Partial<Project> = {}): Project {
  return {
    id: opts.id ?? 'p1',
    name: opts.name ?? 'Projet test',
    affaire: opts.affaire ?? 'Test',
    widthModules: opts.widthModules ?? 18,
    heightMm: opts.heightMm ?? 15,
    bgColor: opts.bgColor ?? 'blanc',
    textColor: opts.textColor ?? 'noir',
    rows: opts.rows ?? [makeRow()],
    createdAt: opts.createdAt ?? Date.now(),
    updatedAt: opts.updatedAt ?? Date.now(),
    schemaVersion: 1,
  };
}

// --- Largeur de tableau ---

describe('validateTableWidth', () => {
  it('accepte 12 modules', () => {
    expect(validateTableWidth(12).ok).toBe(true);
  });

  it('accepte 36 modules', () => {
    expect(validateTableWidth(36).ok).toBe(true);
  });

  it('rejette en dessous de 12', () => {
    const r = validateTableWidth(10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('WIDTH_OUT_OF_RANGE');
  });

  it('rejette au dessus de 36', () => {
    const r = validateTableWidth(40);
    expect(r.ok).toBe(false);
  });

  it('accepte les valeurs impaires dans la plage (saisie libre autorisee)', () => {
    expect(validateTableWidth(13).ok).toBe(true);
    expect(validateTableWidth(15).ok).toBe(true);
    expect(validateTableWidth(17).ok).toBe(true);
  });

  it('rejette les valeurs non entieres', () => {
    const r = validateTableWidth(18.5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('WIDTH_NOT_INTEGER');
  });
});

// --- Nombre de rangees ---

describe('validateRowCount', () => {
  it('accepte 1 rangee', () => {
    expect(validateRowCount(1).ok).toBe(true);
  });

  it('accepte 50 rangees', () => {
    expect(validateRowCount(50).ok).toBe(true);
  });

  it('rejette 0 rangee', () => {
    expect(validateRowCount(0).ok).toBe(false);
  });

  it('rejette 51 rangees', () => {
    expect(validateRowCount(51).ok).toBe(false);
  });
});

// --- Hauteur d'etiquette ---

describe('validateLabelHeight', () => {
  it('accepte chaque hauteur autorisee', () => {
    [15, 30, 40, 50, 100].forEach((h) => {
      expect(validateLabelHeight(h).ok).toBe(true);
    });
  });

  it('accepte les hauteurs libres positives (saisie libre autorisee)', () => {
    expect(validateLabelHeight(20).ok).toBe(true);
    expect(validateLabelHeight(75).ok).toBe(true);
    expect(validateLabelHeight(1).ok).toBe(true);
    expect(validateLabelHeight(500).ok).toBe(true);
  });

  it('rejette 0, valeurs negatives et non entieres', () => {
    expect(validateLabelHeight(0).ok).toBe(false);
    expect(validateLabelHeight(-5).ok).toBe(false);
    expect(validateLabelHeight(501).ok).toBe(false);
    expect(validateLabelHeight(15.5).ok).toBe(false);
  });
});

// --- Couleurs ---

describe('validateColorPair', () => {
  it('accepte fond blanc + texte noir', () => {
    expect(validateColorPair('blanc', 'noir').ok).toBe(true);
  });

  it('accepte fond noir + texte blanc', () => {
    expect(validateColorPair('noir', 'blanc').ok).toBe(true);
  });

  it('rejette fond et texte identiques (texte invisible)', () => {
    const r = validateColorPair('noir', 'noir');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('BG_TEXT_SAME_COLOR');
  });

  it('rejette une couleur hors palette', () => {
    expect(validateColorPair('vert', 'noir').ok).toBe(false);
    expect(validateColorPair('blanc', 'bleu').ok).toBe(false);
  });
});

// --- Texte d'equipement ---

describe('validateEquipmentText', () => {
  it('accepte un texte normal', () => {
    expect(validateEquipmentText('DISJONCTEUR GENERAL', 'p').ok).toBe(true);
  });

  it('rejette un texte avec tiret cadratin', () => {
    const r = validateEquipmentText('Phase 1 \u2014 Phase 2', 'p');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('TEXT_HAS_FORBIDDEN_DASH');
  });

  it('rejette un texte avec demi-cadratin', () => {
    const r = validateEquipmentText('230V \u2013 50Hz', 'p');
    expect(r.ok).toBe(false);
  });

  it('accepte un texte sur 3 lignes', () => {
    expect(validateEquipmentText('CHAUFFAGE\nSALLE DE\nCOURS 14', 'p').ok).toBe(true);
  });

  it('rejette un texte sur 4 lignes', () => {
    expect(validateEquipmentText('a\nb\nc\nd', 'p').ok).toBe(false);
  });
});

// --- Equipement ---

describe('validateEquipment', () => {
  it('accepte un equipement valide', () => {
    const eq = makeEq({ positionHalfModules: 0, widthHalfModules: 4 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(true);
  });

  it('rejette une position negative', () => {
    const eq = makeEq({ positionHalfModules: -1 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(false);
  });

  it('rejette une largeur sur 0 demi-module', () => {
    const eq = makeEq({ widthHalfModules: 0 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(false);
  });

  it('rejette une largeur > 24 demi-modules', () => {
    const eq = makeEq({ widthHalfModules: 25 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(false);
  });

  it('rejette un equipement qui depasse la rangee', () => {
    const eq = makeEq({ positionHalfModules: 33, widthHalfModules: 4 });
    const r = validateEquipment(eq, 36, 'p');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.code === 'EQUIPMENT_OVERFLOWS_ROW')).toBe(true);
  });

  it('accepte un equipement collant le bord droit', () => {
    const eq = makeEq({ positionHalfModules: 32, widthHalfModules: 4 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(true);
  });

  it('accepte un widthMm hors grille positif', () => {
    const eq = makeEq({ widthHalfModules: 22, widthMm: 200 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(true);
  });

  it('rejette un widthMm negatif', () => {
    const eq = makeEq({ widthHalfModules: 4, widthMm: -10 });
    expect(validateEquipment(eq, 36, 'p').ok).toBe(false);
  });
});

// --- Chevauchements ---

describe('validateNoOverlap', () => {
  it('accepte une rangee vide', () => {
    expect(validateNoOverlap(makeRow(), 'p').ok).toBe(true);
  });

  it('accepte deux equipements qui se touchent', () => {
    const row = makeRow({
      equipments: [
        makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 4 }),
        makeEq({ id: 'b', positionHalfModules: 4, widthHalfModules: 4 }),
      ],
    });
    expect(validateNoOverlap(row, 'p').ok).toBe(true);
  });

  it('detecte un chevauchement de 1 demi-module', () => {
    const row = makeRow({
      equipments: [
        makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 4, text: 'A' }),
        makeEq({ id: 'b', positionHalfModules: 3, widthHalfModules: 4, text: 'B' }),
      ],
    });
    const r = validateNoOverlap(row, 'p');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('EQUIPMENTS_OVERLAP');
  });

  it('detecte un chevauchement total', () => {
    const row = makeRow({
      equipments: [
        makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 8, text: 'A' }),
        makeEq({ id: 'b', positionHalfModules: 2, widthHalfModules: 4, text: 'B' }),
      ],
    });
    expect(validateNoOverlap(row, 'p').ok).toBe(false);
  });
});

// --- Projet complet ---

describe('validateProject', () => {
  it('valide le projet de l\'exemple CEFF (3 rangees, 18 modules)', () => {
    const project = makeProject({
      widthModules: 18,
      heightMm: 15,
      rows: [
        makeRow({
          id: 'r1',
          index: 0,
          equipments: [
            makeEq({ id: 'e1', positionHalfModules: 0, widthHalfModules: 11, text: 'DISJONCTEUR GENERAL' }),
            makeEq({ id: 'e2', positionHalfModules: 11, widthHalfModules: 4, text: 'ALARME\nINCENDIE' }),
            makeEq({ id: 'e3', positionHalfModules: 15, widthHalfModules: 4, text: 'BAIE\nINFORMATIQUE' }),
          ],
        }),
        makeRow({
          id: 'r2',
          index: 1,
          equipments: [
            makeEq({ id: 'e4', positionHalfModules: 0, widthHalfModules: 22, widthMm: 200, text: 'GENERAL CHAUFFAGE' }),
          ],
        }),
        makeRow({
          id: 'r3',
          index: 2,
          equipments: [
            makeEq({ id: 'e5', positionHalfModules: 0, widthHalfModules: 4, text: 'CHAUFFAGE\nSALLE DE\nCOURS 14' }),
            makeEq({ id: 'e6', positionHalfModules: 28, widthHalfModules: 4, text: 'CHAUFFAGE\nSALLE DE\nCOURS 15' }),
            makeEq({ id: 'e7', positionHalfModules: 32, widthHalfModules: 4, text: 'CHAUFFAGE\nRANGEMENT' }),
          ],
        }),
      ],
    });
    const r = validateProject(project);
    expect(r.ok).toBe(true);
  });

  it('cumule les erreurs de plusieurs sources', () => {
    const project = makeProject({
      widthModules: 11, // hors plage (< 12)
      bgColor: 'noir',
      textColor: 'noir', // identique
    });
    const r = validateProject(project);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThanOrEqual(2);
      expect(r.errors.some((e) => e.code === 'WIDTH_OUT_OF_RANGE')).toBe(true);
      expect(r.errors.some((e) => e.code === 'BG_TEXT_SAME_COLOR')).toBe(true);
    }
  });
});
