import { describe, expect, it } from 'vitest';
import {
  blueBannerLabel,
  equipmentLengthLabel,
  equipmentLengthLabelCompact,
  formatMm,
  redBannerLabel,
  rowLabel,
  rowTotalLengthLabel,
} from '../utils/labels.js';

describe('rowLabel', () => {
  it('affiche un index 1-based avec accent', () => {
    expect(rowLabel(0)).toBe('Rang\u00e9e 1');
    expect(rowLabel(2)).toBe('Rang\u00e9e 3');
  });
});

describe('equipmentLengthLabel', () => {
  it('affiche LONGUEUR avec orthographe correcte', () => {
    expect(equipmentLengthLabel(36)).toBe('LONGUEUR :\n36 mm');
  });

  it('ne contient pas la coquille LONGEUR', () => {
    const label = equipmentLengthLabel(144);
    expect(label).not.toContain('LONGEUR');
    expect(label).toContain('LONGUEUR');
  });
});

describe('equipmentLengthLabelCompact', () => {
  it('utilise la forme abregee LONG', () => {
    expect(equipmentLengthLabelCompact(18)).toBe('LONG :\n18 mm');
  });
});

describe('rowTotalLengthLabel', () => {
  it('affiche LONGUEUR TOTALE au feminin', () => {
    expect(rowTotalLengthLabel(324)).toBe('LONGUEUR TOTALE : 324 mm');
  });

  it('ne contient pas la coquille TOTAL au masculin', () => {
    const label = rowTotalLengthLabel(648);
    expect(label).toContain('TOTALE');
    expect(label).not.toMatch(/TOTAL :/);
  });
});

describe('blueBannerLabel', () => {
  it('formate avec la reference d\'affaire', () => {
    expect(blueBannerLabel('Lycee Pasteur')).toBe(
      'ETIQUETAGE TABLEAU MODULAIRE \u00b7 Affaire : Lycee Pasteur'
    );
  });

  it('utilise un placeholder si l\'affaire est vide', () => {
    expect(blueBannerLabel('')).toBe(
      'ETIQUETAGE TABLEAU MODULAIRE \u00b7 Affaire : ....'
    );
    expect(blueBannerLabel('   ')).toBe(
      'ETIQUETAGE TABLEAU MODULAIRE \u00b7 Affaire : ....'
    );
  });
});

describe('redBannerLabel', () => {
  it('synthetise les choix globaux du projet', () => {
    const label = redBannerLabel({
      widthModules: 18,
      capacityMm: 324,
      heightMm: 15,
      bgColor: 'blanc',
      textColor: 'noir',
    });
    expect(label).toBe(
      'Capacit\u00e9 par rang\u00e9e : 18 modules = 324 mm \u00b7 Hauteur \u00e9tiquette : 15 mm \u00b7 Fond : Blanc \u00b7 Texte : Noir'
    );
  });

  it('reflete les couleurs choisies par l\'utilisateur', () => {
    const label = redBannerLabel({
      widthModules: 24,
      capacityMm: 432,
      heightMm: 30,
      bgColor: 'noir',
      textColor: 'blanc',
    });
    expect(label).toContain('Fond : Noir');
    expect(label).toContain('Texte : Blanc');
  });
});

describe('formatMm', () => {
  it('omet les decimales pour les entiers', () => {
    expect(formatMm(36)).toBe('36 mm');
  });

  it('garde au plus deux decimales pour les non-entiers', () => {
    expect(formatMm(36.5)).toBe('36.5 mm');
    expect(formatMm(36.123)).toBe('36.12 mm');
  });

  it('strip les zeros decimaux inutiles', () => {
    expect(formatMm(36.1)).toBe('36.1 mm');
    expect(formatMm(36.0)).toBe('36 mm');
  });
});
