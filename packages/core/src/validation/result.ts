/**
 * Resultat de validation. Type discriminant pour forcer le client a verifier
 * le succes avant d'utiliser les donnees.
 */

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

export interface ValidationError {
  /** Code court machine-readable (ex: "WIDTH_OUT_OF_RANGE"). */
  code: string;
  /** Message lisible en francais pour affichage utilisateur. */
  message: string;
  /** Chemin dans le projet pour cibler le champ fautif (ex: "rows[2].equipments[1].text"). */
  path?: string;
}

/** Helper pour construire un succes. */
export const ok = (): ValidationResult => ({ ok: true });

/** Helper pour construire un echec a partir d'une liste d'erreurs. */
export const err = (errors: ValidationError[]): ValidationResult => ({
  ok: false,
  errors,
});

/** Combine plusieurs resultats en un seul. Echoue des qu'un seul echoue. */
export function combine(results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => (r.ok ? [] : r.errors));
  return allErrors.length === 0 ? ok() : err(allErrors);
}
