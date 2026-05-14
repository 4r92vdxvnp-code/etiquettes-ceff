/**
 * Filtre anti tiret cadratin.
 *
 * Regle metier stricte : aucun tiret cadratin (em dash, U+2014) ni demi-cadratin
 * (en dash, U+2013) ne doit apparaitre dans les exports. Ces caracteres sont
 * remplaces par un trait d'union ASCII (U+002D).
 *
 * Pourquoi c'est strict : le graveur industriel travaille a partir des fichiers
 * Excel et PDF. Un caractere unicode non standard peut faire echouer la gravure
 * ou produire un resultat fantaisiste.
 *
 * Ce filtre est applique a trois endroits :
 *   1. A la saisie dans l'UI (filtre temps reel sur les champs texte).
 *   2. A l'export PDF (avant l'ecriture finale).
 *   3. A l'export Excel (avant l'ecriture finale).
 *
 * Le test d'integration consiste a relire le fichier produit et a verifier
 * qu'aucun U+2014 ni U+2013 n'est present.
 */

const EM_DASH = '\u2014';
const EN_DASH = '\u2013';
const HYPHEN = '-';

/**
 * Regex pour le replace global. Le flag 'g' est necessaire pour remplacer toutes
 * les occurrences en une passe. Cette regex n'est utilisee que dans replace(),
 * jamais dans test() (le flag g rend test() stateful, ce qui est un piege classique).
 */
const FORBIDDEN_DASH_REGEX_GLOBAL = /[\u2014\u2013]/g;

/**
 * Regex pour la detection. Pas de flag 'g' : test() doit etre stateless pour
 * etre fiable a chaque appel.
 */
const FORBIDDEN_DASH_REGEX_TEST = /[\u2014\u2013]/;

/**
 * Remplace tous les tirets cadratin et demi-cadratin d'une chaine par des
 * traits d'union ASCII.
 *
 * @example
 *   stripForbiddenDashes('Coupure 230 V \u2014 Phase 1') // 'Coupure 230 V - Phase 1'
 */
export function stripForbiddenDashes(input: string): string {
  return input.replace(FORBIDDEN_DASH_REGEX_GLOBAL, HYPHEN);
}

/**
 * Verifie si une chaine contient au moins un tiret cadratin ou demi-cadratin.
 *
 * Utilisable comme garde-fou dans les tests d'integration : on verifie que la
 * sortie d'un export ne contient AUCUN tiret interdit avant validation.
 */
export function containsForbiddenDash(input: string): boolean {
  return FORBIDDEN_DASH_REGEX_TEST.test(input);
}



/**
 * Sanitize un texte d'etiquette pour la saisie utilisateur.
 *
 * En plus du filtrage des tirets cadratin :
 *   - Normalise les fins de ligne en '\n'.
 *   - Limite a 3 lignes maximum (au-dela, les lignes supplementaires sont coupees).
 *   - Enleve les espaces en debut et fin de chaque ligne.
 */
export function sanitizeLabelText(input: string): string {
  const noDashes = stripForbiddenDashes(input);
  const normalizedNewlines = noDashes.replace(/\r\n?/g, '\n');
  const lines = normalizedNewlines.split('\n').slice(0, 3).map((line) => line.trim());
  return lines.join('\n');
}

/** Constantes exportees pour les tests. */
export const FORBIDDEN_DASHES = { EM_DASH, EN_DASH } as const;
