import { describe, expect, it } from 'vitest';
import {
  detectRowGaps,
  equipmentDisplayWidthMm,
  equipmentLeftMm,
  equipmentLogicalWidthMm,
  equipmentRightMm,
  halfModulesToMm,
  isOffGrid,
  modulesToMm,
  rowCapacityHalfModules,
  rowCapacityMm,
  rowFillRatio,
  rowFreeMm,
  rowOccupiedHalfModules,
  rowOccupiedMm,
} from '../layout/dimensions.js';
import type { Equipment, Project, Row } from '../types/project.js';

function makeEq(opts: Partial<Equipment> = {}): Equipment {
  return {
    id: opts.id ?? 'eq',
    rowId: opts.rowId ?? 'row',
    positionHalfModules: opts.positionHalfModules ?? 0,
    widthHalfModules: opts.widthHalfModules ?? 4,
    text: opts.text ?? 'TEST',
    ...(opts.widthMm !== undefined ? { widthMm: opts.widthMm } : {}),
  };
}

function makeRow(equipments: Equipment[] = []): Row {
  return { id: 'r', index: 0, equipments };
}

function makeProject(widthModules: number, rows: Row[] = []): Project {
  return {
    id: 'p',
    name: 'p',
    affaire: 'a',
    widthModules,
    heightMm: 15,
    bgColor: 'blanc',
    textColor: 'noir',
    rows,
    createdAt: 0,
    updatedAt: 0,
    schemaVersion: 1,
  };
}

describe('conversions de base', () => {
  it('1 demi-module = 9 mm', () => {
    expect(halfModulesToMm(1)).toBe(9);
  });

  it('1 module = 18 mm', () => {
    expect(modulesToMm(1)).toBe(18);
  });

  it('18 modules = 324 mm (cas exemple CEFF)', () => {
    expect(modulesToMm(18)).toBe(324);
  });

  it('36 modules = 648 mm', () => {
    expect(modulesToMm(36)).toBe(648);
  });

  it('reste exact pour les grandes valeurs (pas d\'erreur flottante)', () => {
    // 36 modules x 50 rangees = 1800 modules = 32400 mm
    expect(modulesToMm(36 * 50)).toBe(32400);
  });
});

describe('capacite de rangee', () => {
  it('18 modules = 36 demi-modules', () => {
    const project = makeProject(18);
    expect(rowCapacityHalfModules(project)).toBe(36);
    expect(rowCapacityMm(project)).toBe(324);
  });

  it('24 modules = 432 mm', () => {
    expect(rowCapacityMm(makeProject(24))).toBe(432);
  });
});

describe('largeur d\'equipement', () => {
  it('4 demi-modules = 36 mm en largeur logique', () => {
    const eq = makeEq({ widthHalfModules: 4 });
    expect(equipmentLogicalWidthMm(eq)).toBe(36);
  });

  it('largeur affichee = largeur logique sans widthMm', () => {
    const eq = makeEq({ widthHalfModules: 4 });
    expect(equipmentDisplayWidthMm(eq)).toBe(36);
  });

  it('largeur affichee prend widthMm si defini', () => {
    const eq = makeEq({ widthHalfModules: 22, widthMm: 200 });
    expect(equipmentDisplayWidthMm(eq)).toBe(200);
    expect(equipmentLogicalWidthMm(eq)).toBe(198);
  });

  it('detecte un equipement hors grille', () => {
    const onGrid = makeEq({ widthHalfModules: 4 });
    const offGrid = makeEq({ widthHalfModules: 22, widthMm: 200 });
    expect(isOffGrid(onGrid)).toBe(false);
    expect(isOffGrid(offGrid)).toBe(true);
  });

  it('ne marque pas hors grille si widthMm coincide avec la grille', () => {
    const eq = makeEq({ widthHalfModules: 4, widthMm: 36 });
    expect(isOffGrid(eq)).toBe(false);
  });
});

describe('positions d\'equipement', () => {
  it('bord gauche en mm', () => {
    expect(equipmentLeftMm(makeEq({ positionHalfModules: 11 }))).toBe(99);
  });

  it('bord droit logique en mm', () => {
    const eq = makeEq({ positionHalfModules: 11, widthHalfModules: 4 });
    expect(equipmentRightMm(eq)).toBe(99 + 36);
  });
});

describe('occupation de rangee', () => {
  it('rangee vide', () => {
    expect(rowOccupiedHalfModules(makeRow())).toBe(0);
    expect(rowOccupiedMm(makeRow())).toBe(0);
  });

  it('somme des largeurs', () => {
    const row = makeRow([
      makeEq({ widthHalfModules: 11 }),
      makeEq({ widthHalfModules: 4 }),
      makeEq({ widthHalfModules: 4 }),
    ]);
    expect(rowOccupiedHalfModules(row)).toBe(19);
    expect(rowOccupiedMm(row)).toBe(171);
  });

  it('espace libre = capacite - occupation', () => {
    const project = makeProject(18);
    const row = makeRow([makeEq({ widthHalfModules: 11 })]);
    expect(rowFreeMm(project, row)).toBe(324 - 99);
  });

  it('taux de remplissage', () => {
    const project = makeProject(18); // 36 demi-modules
    const row = makeRow([makeEq({ widthHalfModules: 18 })]);
    expect(rowFillRatio(project, row)).toBe(0.5);
  });
});

describe('detectRowGaps', () => {
  it('aucun trou si la rangee est entierement occupee', () => {
    const project = makeProject(18);
    const row = makeRow([makeEq({ positionHalfModules: 0, widthHalfModules: 36 })]);
    expect(detectRowGaps(project, row)).toEqual([]);
  });

  it('un trou en fin de rangee', () => {
    const project = makeProject(18); // 36 demi-modules
    const row = makeRow([makeEq({ positionHalfModules: 0, widthHalfModules: 11 })]);
    expect(detectRowGaps(project, row)).toEqual([
      { startHalfModules: 11, widthHalfModules: 25 },
    ]);
  });

  it('un trou en debut de rangee', () => {
    const project = makeProject(18);
    const row = makeRow([makeEq({ positionHalfModules: 11, widthHalfModules: 25 })]);
    expect(detectRowGaps(project, row)).toEqual([
      { startHalfModules: 0, widthHalfModules: 11 },
    ]);
  });

  it('plusieurs trous (cas exemple rangee 1 CEFF)', () => {
    const project = makeProject(18);
    // DISJONCTEUR(0-11) + ALARME(11-15) + BAIE(15-19) + vide(19-31) + un cube(31-33) + un cube(33-35) + vide(35-36)
    const row = makeRow([
      makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 11 }),
      makeEq({ id: 'b', positionHalfModules: 11, widthHalfModules: 4 }),
      makeEq({ id: 'c', positionHalfModules: 15, widthHalfModules: 4 }),
      makeEq({ id: 'd', positionHalfModules: 31, widthHalfModules: 2 }),
      makeEq({ id: 'e', positionHalfModules: 33, widthHalfModules: 2 }),
    ]);
    const gaps = detectRowGaps(project, row);
    expect(gaps).toEqual([
      { startHalfModules: 19, widthHalfModules: 12 },
      { startHalfModules: 35, widthHalfModules: 1 },
    ]);
  });

  it('retourne les trous tries par position meme si les equipements ne le sont pas', () => {
    const project = makeProject(18);
    const row = makeRow([
      makeEq({ id: 'b', positionHalfModules: 20, widthHalfModules: 4 }),
      makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 4 }),
    ]);
    const gaps = detectRowGaps(project, row);
    expect(gaps).toEqual([
      { startHalfModules: 4, widthHalfModules: 16 },
      { startHalfModules: 24, widthHalfModules: 12 },
    ]);
  });
});
