/**
 * Calcul de mise en page neutre, partage entre l'apercu ecran et l'export PDF.
 *
 * Cette fonction produit une structure geometrique en millimetres, sans aucune
 * dependance au moyen de rendu. L'UI applique un facteur d'echelle CSS pour
 * tenir dans le viewport. Le PDF applique un facteur d'echelle pour tenir
 * dans la zone utile A3 paysage.
 *
 * Le partage de cette fonction est essentiel : il garantit que ce que l'utilisateur
 * voit a l'ecran est strictement identique a ce que le graveur recevra.
 */

import type { Project, Row } from '../types/project.js';
import {
  detectRowGaps,
  equipmentDisplayWidthMm,
  equipmentLeftMm,
  equipmentLogicalWidthMm,
  rowCapacityMm,
  type RowGap,
} from './dimensions.js';

/** Element rendu : une cellule occupee par un equipement. */
export interface LayoutEquipmentCell {
  type: 'equipment';
  equipmentId: string;
  /** Position du bord gauche dans la rangee, en mm. */
  leftMm: number;
  /** Largeur affichee, en mm (peut etre hors grille si widthMm est defini). */
  widthMm: number;
  /** Largeur logique en mm (toujours sur la grille demi-module). */
  logicalWidthMm: number;
  /** Indique si l'equipement est hors grille demi-module. */
  offGrid: boolean;
  text: string;
}

/** Element rendu : un intervalle vide entre deux equipements. */
export interface LayoutGapCell {
  type: 'gap';
  /** Position du bord gauche dans la rangee, en mm. */
  leftMm: number;
  /** Largeur du trou, en mm. */
  widthMm: number;
}

export type LayoutCell = LayoutEquipmentCell | LayoutGapCell;

export interface LayoutRow {
  rowId: string;
  index: number;
  /** Cellules de la rangee dans l'ordre des positions, equipements + trous melanges. */
  cells: LayoutCell[];
  /** Largeur totale de la rangee, en mm (= capacite du tableau). */
  totalWidthMm: number;
}

export interface ProjectLayout {
  /** Largeur totale du tableau, en mm. */
  widthMm: number;
  /** Hauteur d'une etiquette, en mm. Identique pour toutes les rangees. */
  labelHeightMm: number;
  rows: LayoutRow[];
}

/**
 * Calcule le layout d'un projet entier en millimetres.
 *
 * @param project - Projet valide. Si invalide, le resultat est indefini ;
 *                  il faut appeler validateProject() en amont.
 */
export function layoutProject(project: Project): ProjectLayout {
  const widthMm = rowCapacityMm(project);

  const rows: LayoutRow[] = project.rows.map((row) => layoutRow(project, row));

  return {
    widthMm,
    labelHeightMm: project.heightMm,
    rows,
  };
}

function layoutRow(project: Project, row: Row): LayoutRow {
  const equipments = [...row.equipments].sort(
    (a, b) => a.positionHalfModules - b.positionHalfModules
  );
  const gaps = detectRowGaps(project, row);

  const equipmentCells: LayoutEquipmentCell[] = equipments.map((eq) => ({
    type: 'equipment',
    equipmentId: eq.id,
    leftMm: equipmentLeftMm(eq),
    widthMm: equipmentDisplayWidthMm(eq),
    logicalWidthMm: equipmentLogicalWidthMm(eq),
    offGrid: eq.widthMm !== undefined && Math.abs(eq.widthMm - equipmentLogicalWidthMm(eq)) > 0.01,
    text: eq.text,
  }));

  const gapCells: LayoutGapCell[] = gaps.map((gap: RowGap) => ({
    type: 'gap',
    leftMm: gap.startHalfModules * 9,
    widthMm: gap.widthHalfModules * 9,
  }));

  // Fusion + tri par position pour produire la sequence finale
  const cells: LayoutCell[] = [...equipmentCells, ...gapCells].sort(
    (a, b) => a.leftMm - b.leftMm
  );

  return {
    rowId: row.id,
    index: row.index,
    cells,
    totalWidthMm: rowCapacityMm(project),
  };
}
