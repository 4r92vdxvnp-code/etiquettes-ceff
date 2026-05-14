/**
 * Appel a l'API Claude pour la detection d'equipements depuis une photo de
 * tableau electrique modulaire.
 *
 * L'appel se fait directement depuis le navigateur avec le header
 * anthropic-dangerous-direct-browser-access requis par Anthropic pour les
 * appels cross-origin depuis une page web.
 */

export interface DetectedEquipment {
  /** Libelle detecte tel qu'inscrit sur l'equipement. */
  text: string;
  /** Largeur estimee en modules entiers (1 module = 18 mm). */
  widthModules: number;
}

const DETECTION_PROMPT =
  'Analyse cette photo de tableau electrique modulaire. ' +
  'Liste tous les equipements visibles avec leur libelle (tel qu\'inscrit sur l\'etiquette ou le disjoncteur) ' +
  'et leur largeur estimee en modules (1 module = 18mm). ' +
  'Reponds UNIQUEMENT avec du JSON valide : ' +
  '[{"text": "GENERAL", "widthModules": 2}, ...]. ' +
  'Si tu ne vois pas de tableau electrique, retourne [].';

/**
 * Detecte les equipements d'un tableau electrique depuis une image.
 *
 * @param imageBase64 Image encodee en base64 (sans le prefixe data URL).
 * @param mimeType    Type MIME de l'image.
 * @param apiKey      Cle API Anthropic.
 * @returns Liste des equipements detectes.
 */
export async function detectEquipmentFromPhoto(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
  apiKey: string
): Promise<DetectedEquipment[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: DETECTION_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Cle API invalide ou non autorisee.');
    }
    if (response.status === 429) {
      throw new Error('Limite de requetes atteinte. Reessayez dans quelques instants.');
    }
    throw new Error(`Erreur API (${response.status.toString()}). Verifiez votre cle API.`);
  }

  interface AnthropicResponse {
    content: Array<{ type: string; text?: string }>;
  }

  const data = (await response.json()) as AnthropicResponse;
  const textContent = data.content.find((c) => c.type === 'text');
  if (textContent === undefined || textContent.text === undefined) {
    throw new Error('Reponse inattendue de l\'API Claude.');
  }

  const rawText = textContent.text.trim();

  // Extraction du JSON : cherche le premier '[' et le dernier ']'
  const start = rawText.indexOf('[');
  const end = rawText.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    // Pas de JSON trouve : tableau vide
    return [];
  }

  const jsonStr = rawText.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Reponse JSON malformee recue depuis Claude.');
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // Validation et normalisation de chaque element
  const result: DetectedEquipment[] = [];
  for (const item of parsed) {
    if (item !== null && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const text = typeof obj['text'] === 'string' ? obj['text'].trim() : '';
      const widthModules = typeof obj['widthModules'] === 'number'
        ? Math.max(1, Math.min(12, Math.round(obj['widthModules'])))
        : 1;
      if (text !== '') {
        result.push({ text, widthModules });
      }
    }
  }

  return result;
}
