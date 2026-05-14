/**
 * Validateurs metier pour le modele Project.
 *
 * Toute mutation du projet doit passer par ces validateurs avant d'etre committee
 * dans le store. Ils garantissent les invariants suivants :
 *   1. Largeur de tableau paire entre 12 et 36 modules.
 *   2. Nombre de rangees entre 1 et 50.
 *   3. Hauteur d'etiquette dans la liste autorisee.
 *   4. Couleur fond differente de couleur texte (sinon texte invisible).
 *   5. Position et largeur d'equipement entieres et positives en demi-modules.
 *   6. Largeur d'equipement entre 1 et 24 demi-modules.
 *   7. Equipement entierement contenu dans la rangee.
 *   8. Pas de chevauchement entre deux equipements de la meme rangee.
 *   9. Aucun tiret cadratin dans les textes saisis.
 *  10. Texte d'etiquette de longueur raisonnable (3 lignes max).
 */

import type { Equipment, Project, Row } from '../types/project.js';
import {
  LABEL_HEIGHTS_MM,
  LABEL_COLORS,
  MAX_EQUIPMENT_HALF_MODULES,
  MAX_ROW_COUNT,
  MAX_TABLE_WIDTH_MODULES,
  MIN_EQUIPMENT_HALF_MODULES,
  MIN_ROW_COUNT,
  MIN_TABLE_WIDTH_MODULES,
} from '../types/units.js';
import { containsForbiddenDash } from '../utils/text-sanitizer.js';
import { combine, err, ok, type ValidationError, type ValidationResult } from './result.js';

// --- Validateurs unitaires ---

export function validateTableWidth(widthModules: number): ValidationResult {
  if (!Number.isInteger(widthModules)) {
    return err([
      {
        code: 'WIDTH_NOT_INTEGER',
        message: 'La largeur du tableau doit etre un nombre entier de modules.',
        path: 'widthModules',
      },
    ]);
  }
  if (widthModules < MIN_TABLE_WIDTH_MODULES || widthModules > MAX_TABLE_WIDTH_MODULES) {
    return err([
      {
        code: 'WIDTH_OUT_OF_RANGE',
        message: `La largeur du tableau doit etre comprise entre ${MIN_TABLE_WIDTH_MODULES} et ${MAX_TABLE_WIDTH_MODULES} modules.`,
        path: 'widthModules',
      },
    ]);
  }
  return ok();
}

export function validateRowCount(rowCount: number): ValidationResult {
  if (rowCount < MIN_ROW_COUNT || rowCount > MAX_ROW_COUNT) {
    return err([
      {
        code: 'ROW_COUNT_OUT_OF_RANGE',
        message: `Le nombre de rangees doit etre compris entre ${MIN_ROW_COUNT} et ${MAX_ROW_COUNT}.`,
        path: 'rows',
      },
    ]);
  }
  return ok();
}

export function validateLabelHeight(heightMm: number): ValidationResult {
  if (!Number.isInteger(heightMm) || heightMm <= 0 || heightMm > 500) {
    return err([
      {
        code: 'HEIGHT_OUT_OF_RANGE',
        message: `La hauteur d'etiquette doit etre un entier entre 1 et 500 mm (valeurs standards : ${LABEL_HEIGHTS_MM.join(', ')} mm).`,
        path: 'heightMm',
      },
    ]);
  }
  return ok();
}

export function validateColorPair(bgColor: string, textColor: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (!(LABEL_COLORS as readonly string[]).includes(bgColor)) {
    errors.push({
      code: 'BG_COLOR_NOT_ALLOWED',
      message: `La couleur de fond doit etre l'une de : ${LABEL_COLORS.join(', ')}.`,
      path: 'bgColor',
    });
  }
  if (!(LABEL_COLORS as readonly string[]).includes(textColor)) {
    errors.push({
      code: 'TEXT_COLOR_NOT_ALLOWED',
      message: `La couleur du texte doit etre l'une de : ${LABEL_COLORS.join(', ')}.`,
      path: 'textColor',
    });
  }
  if (errors.length === 0 && bgColor === textColor) {
    errors.push({
      code: 'BG_TEXT_SAME_COLOR',
      message: 'La couleur du texte doit etre differente de la couleur de fond.',
      path: 'textColor',
    });
  }
  return errors.length === 0 ? ok() : err(errors);
}

export function validateEquipmentText(text: string, path: string): ValidationResult {
  const errors: ValidationError[] = [];
  if (containsForbiddenDash(text)) {
    errors.push({
      code: 'TEXT_HAS_FORBIDDEN_DASH',
      message: 'Le texte contient un tiret cadratin ou demi-cadratin (interdit).',
      path,
    });
  }
  const lineCount = text.split('\n').length;
  if (lineCount > 3) {
    errors.push({
      code: 'TEXT_TOO_MANY_LINES',
      message: 'Le texte ne peut pas depasser 3 lignes.',
      path,
    });
  }
  return errors.length === 0 ? ok() : err(errors);
}

export function validateEquipment(
  equipment: Equipment,
  tableWidthHalfModules: number,
  path: string
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(equipment.positionHalfModules) || equipment.positionHalfModules < 0) {
    errors.push({
      code: 'POSITION_INVALID',
      message: 'La position doit etre un entier positif ou nul (en demi-modules).',
      path: `${path}.positionHalfModules`,
    });
  }

  if (
    !Number.isInteger(equipment.widthHalfModules) ||
    equipment.widthHalfModules < MIN_EQUIPMENT_HALF_MODULES ||
    equipment.widthHalfModules > MAX_EQUIPMENT_HALF_MODULES
  ) {
    errors.push({
      code: 'WIDTH_INVALID',
      message: `La largeur d'equipement doit etre un entier entre ${MIN_EQUIPMENT_HALF_MODULES} et ${MAX_EQUIPMENT_HALF_MODULES} demi-modules.`,
      path: `${path}.widthHalfModules`,
    });
  }

  // Verification que l'equipement tient dans la rangee
  if (errors.length === 0) {
    const rightEdge = equipment.positionHalfModules + equipment.widthHalfModules;
    if (rightEdge > tableWidthHalfModules) {
      errors.push({
        code: 'EQUIPMENT_OVERFLOWS_ROW',
        message: 'L equipement depasse la largeur du tableau.',
        path: `${path}.positionHalfModules`,
      });
    }
  }

  // Largeur hors grille (optionnelle) doit etre strictement positive si definie
  if (equipment.widthMm !== undefined) {
    if (!Number.isFinite(equipment.widthMm) || equipment.widthMm <= 0) {
      errors.push({
        code: 'OFF_GRID_WIDTH_INVALID',
        message: 'La largeur reelle (mm) doit etre un nombre strictement positif.',
        path: `${path}.widthMm`,
      });
    }
  }

  // Validation du texte
  const textResult = validateEquipmentText(equipment.text, `${path}.text`);
  if (!textResult.ok) {
    errors.push(...textResult.errors);
  }

  return errors.length === 0 ? ok() : err(errors);
}

/**
 * Verifie qu'aucun equipement de la rangee ne chevauche un autre.
 *
 * Algorithme : on trie les equipements par position, puis on verifie pour chaque
 * paire consecutive que la fin de l'un est <= au debut du suivant.
 */
export function validateNoOverlap(row: Row, path: string): ValidationResult {
  const sorted = [...row.equipments].sort(
    (a, b) => a.positionHalfModules - b.positionHalfModules
  );
  const errors: ValidationError[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current === undefined || next === undefined) continue;
    const currentEnd = current.positionHalfModules + current.widthHalfModules;
    if (currentEnd > next.positionHalfModules) {
      errors.push({
        code: 'EQUIPMENTS_OVERLAP',
        message: `Les equipements "${current.text.split('\n')[0]}" et "${next.text.split('\n')[0]}" se chevauchent.`,
        path: `${path}.equipments`,
      });
    }
  }
  return errors.length === 0 ? ok() : err(errors);
}

export function validateRow(
  row: Row,
  rowIndex: number,
  tableWidthHalfModules: number
): ValidationResult {
  const path = `rows[${rowIndex}]`;
  const equipmentResults = row.equipments.map((eq, eqIndex) =>
    validateEquipment(eq, tableWidthHalfModules, `${path}.equipments[${eqIndex}]`)
  );
  return combine([...equipmentResults, validateNoOverlap(row, path)]);
}

/**
 * Valide un projet entier. Point d'entree principal a appeler avant chaque commit
 * dans le store.
 */
export function validateProject(project: Project): ValidationResult {
  const tableWidthHalfModules = project.widthModules * 2;
  const rowResults = project.rows.map((row, idx) =>
    validateRow(row, idx, tableWidthHalfModules)
  );

  return combine([
    validateTableWidth(project.widthModules),
    validateRowCount(project.rows.length),
    validateLabelHeight(project.heightMm),
    validateColorPair(project.bgColor, project.textColor),
    ...rowResults,
  ]);
}
