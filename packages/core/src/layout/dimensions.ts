/**
 * Moteur dimensionnel.
 *
 * Convertit les donnees logiques (demi-modules entiers) en dimensions physiques
 * (millimetres). Toutes les fonctions de ce module sont pures et testables.
 *
 * Regle d'or : on ne fait jamais d'arithmetique flottante sur les positions ou
 * largeurs en demi-modules. Les conversions vers mm sont des multiplications
 * deterministes.
 */

import type { Equipment, Project, Row } from '../types/project.js';
import { FULL_MODULE_MM, HALF_MODULE_MM } from '../types/units.js';

// --- Conversions de base ---

/** Convertit une dimension en demi-modules vers des millimetres. */
export function halfModulesToMm(halfModules: number): number {
  return halfModules * HALF_MODULE_MM;
}

/** Convertit une dimension en modules vers des millimetres. */
export function modulesToMm(modules: number): number {
  return modules * FULL_MODULE_MM;
}

// --- Dimensions du tableau ---

/** Capacite totale d'une rangee, en demi-modules. */
export function rowCapacityHalfModules(project: Project): number {
  return project.widthModules * 2;
}

/** Capacite totale d'une rangee, en millimetres. */
export function rowCapacityMm(project: Project): number {
  return modulesToMm(project.widthModules);
}

// --- Dimensions des equipements ---

/**
 * Largeur affichee d'un equipement en millimetres.
 *
 * Si l'equipement a un widthMm explicite (cas hors grille), c'est cette valeur
 * qui est utilisee pour les cotes du PDF. Sinon, c'est la conversion classique
 * depuis widthHalfModules.
 */
export function equipmentDisplayWidthMm(equipment: Equipment): number {
  if (equipment.widthMm !== undefined) {
    return equipment.widthMm;
  }
  return halfModulesToMm(equipment.widthHalfModules);
}

/**
 * Largeur logique d'un equipement en millimetres (toujours depuis demi-modules).
 *
 * Sert pour la mise en page interne de la rangee, ou la grille demi-module est
 * la reference. Different de equipmentDisplayWidthMm quand l'equipement est
 * declare hors grille.
 */
export function equipmentLogicalWidthMm(equipment: Equipment): number {
  return halfModulesToMm(equipment.widthHalfModules);
}

/** Position du bord gauche de l'equipement dans la rangee, en millimetres. */
export function equipmentLeftMm(equipment: Equipment): number {
  return halfModulesToMm(equipment.positionHalfModules);
}

/** Position du bord droit (logique) de l'equipement dans la rangee, en millimetres. */
export function equipmentRightMm(equipment: Equipment): number {
  return equipmentLeftMm(equipment) + equipmentLogicalWidthMm(equipment);
}

/**
 * Indique si la largeur d'un equipement est hors grille demi-module.
 * Utile pour afficher un avertissement visuel a l'utilisateur.
 */
export function isOffGrid(equipment: Equipment): boolean {
  if (equipment.widthMm === undefined) return false;
  const gridMm = halfModulesToMm(equipment.widthHalfModules);
  return Math.abs(equipment.widthMm - gridMm) > 0.01;
}

// --- Occupation de rangee ---

/** Somme des largeurs logiques des equipements de la rangee, en demi-modules. */
export function rowOccupiedHalfModules(row: Row): number {
  return row.equipments.reduce((sum, eq) => sum + eq.widthHalfModules, 0);
}

/** Somme des largeurs logiques des equipements de la rangee, en millimetres. */
export function rowOccupiedMm(row: Row): number {
  return halfModulesToMm(rowOccupiedHalfModules(row));
}

/** Espace libre dans une rangee, en demi-modules. */
export function rowFreeHalfModules(project: Project, row: Row): number {
  return rowCapacityHalfModules(project) - rowOccupiedHalfModules(row);
}

/** Espace libre dans une rangee, en millimetres. */
export function rowFreeMm(project: Project, row: Row): number {
  return halfModulesToMm(rowFreeHalfModules(project, row));
}

/** Pourcentage de remplissage d'une rangee (0 a 1). */
export function rowFillRatio(project: Project, row: Row): number {
  const capacity = rowCapacityHalfModules(project);
  if (capacity === 0) return 0;
  return rowOccupiedHalfModules(row) / capacity;
}

// --- Trous (intervalles vides) ---

export interface RowGap {
  /** Position du debut du trou, en demi-modules. */
  startHalfModules: number;
  /** Largeur du trou, en demi-modules. */
  widthHalfModules: number;
}

/**
 * Detecte les intervalles vides dans une rangee, dans l'ordre des positions.
 *
 * Utile pour le rendu PDF : chaque trou est dessine comme un rectangle vide
 * (sans texte ni cote), entre les equipements.
 *
 * Hypothese : la rangee est valide (pas de chevauchement). Si elle ne l'est pas,
 * le resultat est indefini ; il faut valider avant.
 */
export function detectRowGaps(project: Project, row: Row): RowGap[] {
  const sorted = [...row.equipments].sort(
    (a, b) => a.positionHalfModules - b.positionHalfModules
  );
  const capacity = rowCapacityHalfModules(project);
  const gaps: RowGap[] = [];

  let cursor = 0;
  for (const eq of sorted) {
    if (eq.positionHalfModules > cursor) {
      gaps.push({
        startHalfModules: cursor,
        widthHalfModules: eq.positionHalfModules - cursor,
      });
    }
    cursor = eq.positionHalfModules + eq.widthHalfModules;
  }
  if (cursor < capacity) {
    gaps.push({
      startHalfModules: cursor,
      widthHalfModules: capacity - cursor,
    });
  }
  return gaps;
}
