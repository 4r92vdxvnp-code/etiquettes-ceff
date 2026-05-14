/**
 * Tests du filtre anti tiret cadratin.
 *
 * Ces tests sont les plus critiques du package : ils garantissent qu'aucun
 * caractere unicode interdit ne peut survivre a la chaine de traitement.
 */

import { describe, expect, it } from 'vitest';
import {
  containsForbiddenDash,
  FORBIDDEN_DASHES,
  sanitizeLabelText,
  stripForbiddenDashes,
} from '../utils/text-sanitizer.js';

describe('stripForbiddenDashes', () => {
  it('remplace le tiret cadratin (em dash) par un trait d\'union', () => {
    expect(stripForbiddenDashes('Phase 1 \u2014 Phase 2')).toBe('Phase 1 - Phase 2');
  });

  it('remplace le demi-cadratin (en dash) par un trait d\'union', () => {
    expect(stripForbiddenDashes('230 V \u2013 50 Hz')).toBe('230 V - 50 Hz');
  });

  it('remplace plusieurs occurrences dans la meme chaine', () => {
    expect(stripForbiddenDashes('a\u2014b\u2013c\u2014d')).toBe('a-b-c-d');
  });

  it('ne touche pas aux traits d\'union ASCII existants', () => {
    expect(stripForbiddenDashes('semi-conducteur')).toBe('semi-conducteur');
  });

  it('ne touche pas a une chaine sans tiret interdit', () => {
    expect(stripForbiddenDashes('DISJONCTEUR GENERAL')).toBe('DISJONCTEUR GENERAL');
  });

  it('gere une chaine vide', () => {
    expect(stripForbiddenDashes('')).toBe('');
  });
});

describe('containsForbiddenDash', () => {
  it('detecte le tiret cadratin', () => {
    expect(containsForbiddenDash(`a${FORBIDDEN_DASHES.EM_DASH}b`)).toBe(true);
  });

  it('detecte le demi-cadratin', () => {
    expect(containsForbiddenDash(`a${FORBIDDEN_DASHES.EN_DASH}b`)).toBe(true);
  });

  it('rejette une chaine avec uniquement des traits d\'union ASCII', () => {
    expect(containsForbiddenDash('semi-conducteur')).toBe(false);
  });

  it('rejette une chaine vide', () => {
    expect(containsForbiddenDash('')).toBe(false);
  });
});

describe('sanitizeLabelText', () => {
  it('strip les tirets interdits', () => {
    expect(sanitizeLabelText('A \u2014 B')).toBe('A - B');
  });

  it('normalise les fins de ligne Windows', () => {
    expect(sanitizeLabelText('ligne1\r\nligne2')).toBe('ligne1\nligne2');
  });

  it('coupe a 3 lignes maximum', () => {
    const input = 'l1\nl2\nl3\nl4\nl5';
    expect(sanitizeLabelText(input)).toBe('l1\nl2\nl3');
  });

  it('trim les espaces de chaque ligne', () => {
    expect(sanitizeLabelText('  hello  \n  world  ')).toBe('hello\nworld');
  });

  it('gere les cas combines (tirets + multilignes + espaces)', () => {
    const input = '  PHASE 1 \u2014 R \r\n  PHASE 2 \u2013 S  \r\n  PHASE 3 \u2014 T  ';
    expect(sanitizeLabelText(input)).toBe('PHASE 1 - R\nPHASE 2 - S\nPHASE 3 - T');
  });

  it('garantit qu\'aucun tiret interdit ne sort jamais', () => {
    const adversarial = '\u2014\u2013\u2014\u2013';
    const result = sanitizeLabelText(adversarial);
    expect(containsForbiddenDash(result)).toBe(false);
  });
});
