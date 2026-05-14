import { describe, expect, it } from 'vitest';
import { layoutProject } from '../layout/layout.js';
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

function makeRow(id: string, index: number, equipments: Equipment[]): Row {
  return { id, index, equipments };
}

function makeProject(rows: Row[]): Project {
  return {
    id: 'p',
    name: 'p',
    affaire: 'Lycee Pasteur',
    widthModules: 18,
    heightMm: 15,
    bgColor: 'blanc',
    textColor: 'noir',
    rows,
    createdAt: 0,
    updatedAt: 0,
    schemaVersion: 1,
  };
}

describe('layoutProject', () => {
  it('reproduit le cas exemple CEFF rangee 1', () => {
    const project = makeProject([
      makeRow('r1', 0, [
        makeEq({ id: 'e1', positionHalfModules: 0, widthHalfModules: 11, text: 'DISJONCTEUR GENERAL' }),
        makeEq({ id: 'e2', positionHalfModules: 11, widthHalfModules: 4, text: 'ALARME\nINCENDIE' }),
        makeEq({ id: 'e3', positionHalfModules: 15, widthHalfModules: 4, text: 'BAIE\nINFORMATIQUE' }),
      ]),
    ]);

    const layout = layoutProject(project);

    expect(layout.widthMm).toBe(324);
    expect(layout.labelHeightMm).toBe(15);
    expect(layout.rows).toHaveLength(1);

    const row = layout.rows[0]!;
    expect(row.totalWidthMm).toBe(324);
    // 3 equipements + 1 trou en fin = 4 cellules
    expect(row.cells).toHaveLength(4);

    // Positions et largeurs
    const cell0 = row.cells[0]!;
    expect(cell0.type).toBe('equipment');
    expect(cell0.leftMm).toBe(0);
    expect(cell0.widthMm).toBe(99);

    const cell1 = row.cells[1]!;
    expect(cell1.type).toBe('equipment');
    expect(cell1.leftMm).toBe(99);
    expect(cell1.widthMm).toBe(36);

    const cell3 = row.cells[3]!;
    expect(cell3.type).toBe('gap');
    expect(cell3.leftMm).toBe(171);
    expect(cell3.widthMm).toBe(324 - 171);
  });

  it('produit un equipement off-grid avec widthMm preserve', () => {
    const project = makeProject([
      makeRow('r1', 0, [
        makeEq({ id: 'e1', positionHalfModules: 0, widthHalfModules: 22, widthMm: 200, text: 'GENERAL CHAUFFAGE' }),
      ]),
    ]);

    const layout = layoutProject(project);
    const cell = layout.rows[0]!.cells[0]!;
    expect(cell.type).toBe('equipment');
    if (cell.type === 'equipment') {
      expect(cell.widthMm).toBe(200);
      expect(cell.logicalWidthMm).toBe(198);
      expect(cell.offGrid).toBe(true);
    }
  });

  it('rangee vide = un seul trou de la largeur du tableau', () => {
    const project = makeProject([makeRow('r1', 0, [])]);
    const layout = layoutProject(project);
    const row = layout.rows[0]!;
    expect(row.cells).toHaveLength(1);
    expect(row.cells[0]!.type).toBe('gap');
    expect(row.cells[0]!.widthMm).toBe(324);
  });

  it('cellules triees par position meme si les equipements ne le sont pas', () => {
    const project = makeProject([
      makeRow('r1', 0, [
        makeEq({ id: 'b', positionHalfModules: 20, widthHalfModules: 4 }),
        makeEq({ id: 'a', positionHalfModules: 0, widthHalfModules: 4 }),
      ]),
    ]);
    const layout = layoutProject(project);
    const cells = layout.rows[0]!.cells;
    // Ordre attendu : eq a (0), gap (4-20), eq b (20), gap (24-36)
    expect(cells.map((c) => c.leftMm)).toEqual([0, 36, 180, 216]);
  });

  it('le layout est strictement deterministe', () => {
    const project = makeProject([
      makeRow('r1', 0, [
        makeEq({ id: 'e1', positionHalfModules: 0, widthHalfModules: 11 }),
        makeEq({ id: 'e2', positionHalfModules: 11, widthHalfModules: 4 }),
      ]),
    ]);
    const layout1 = layoutProject(project);
    const layout2 = layoutProject(project);
    expect(layout1).toEqual(layout2);
  });
});
