import { useRef, useState } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useProjectStore } from '../store/projectStore.js';
import { detectEquipmentFromPhoto, type DetectedEquipment } from '../lib/claudeVision.js';

interface AiDetectionProps {
  open: boolean;
  onClose: () => void;
}

export function AiDetection({ open, onClose }: AiDetectionProps): JSX.Element | null {
  const claudeApiKey = useAppStore((s) => s.claudeApiKey);
  const setClaudeApiKey = useAppStore((s) => s.setClaudeApiKey);
  const project = useProjectStore((s) => s.project);
  const addEquipmentsFromDetection = useProjectStore((s) => s.addEquipmentsFromDetection);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey ?? '');
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedEquipment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedRowId, setImportedRowId] = useState<string>(
    project.rows[0]?.id ?? ''
  );
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file === undefined) return;

    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    setImageMime(mime);
    setDetected(null);
    setError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setImageDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleDetect(): Promise<void> {
    if (imageDataUrl === null) return;
    const key = apiKeyInput.trim();
    if (key === '') {
      setError('Veuillez entrer votre clé API Claude.');
      return;
    }

    // Sauvegarder la cle si elle a change
    if (key !== claudeApiKey) {
      setClaudeApiKey(key);
    }

    setDetecting(true);
    setError(null);
    setDetected(null);

    try {
      // Extraire le base64 pur depuis le data URL
      const base64 = imageDataUrl.split(',')[1] ?? '';
      const results = await detectEquipmentFromPhoto(base64, imageMime, key);
      setDetected(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors de la detection.');
    } finally {
      setDetecting(false);
    }
  }

  function handleImport(): void {
    if (detected === null || detected.length === 0) return;
    const items = detected.map((d) => ({
      text: d.text,
      widthHalfModules: d.widthModules * 2, // 1 module = 2 demi-modules
    }));
    addEquipmentsFromDetection(importedRowId, items);
    setImportSuccess(true);
    setDetected(null);
    setTimeout(() => {
      setImportSuccess(false);
      onClose();
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
        {/* En-tete */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1F3864] text-white">
          <h2 className="text-base font-bold uppercase tracking-wide">Analyse photo - IA</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-4">
          {/* Upload image */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Photo du tableau électrique
            </p>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Choisir une photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Apercu image */}
          {imageDataUrl !== null && (
            <div className="rounded border border-gray-200 overflow-hidden">
              <img
                src={imageDataUrl}
                alt="Aperçu tableau"
                className="w-full max-h-48 object-contain bg-gray-50"
              />
            </div>
          )}

          {/* Cle API */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600" htmlFor="claude-api-key">
              Clé API Claude (Anthropic)
            </label>
            <input
              id="claude-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
            />
            <p className="mt-1 text-xs text-gray-400">
              La clé est stockée localement dans votre navigateur.
            </p>
          </div>

          {/* Bouton detection */}
          <button
            onClick={() => void handleDetect()}
            disabled={detecting || imageDataUrl === null}
            className="w-full flex items-center justify-center gap-2 rounded bg-[#1F3864] px-4 py-2 text-sm font-bold text-white hover:bg-[#162a4e] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {detecting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyse en cours...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Détecter les équipements
              </>
            )}
          </button>

          {/* Erreur */}
          {error !== null && (
            <div
              role="alert"
              className="rounded border border-[#C00000] bg-red-50 px-3 py-2 text-xs font-bold text-[#C00000]"
            >
              {error}
            </div>
          )}

          {/* Resultats */}
          {detected !== null && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                {detected.length === 0
                  ? 'Aucun équipement détecté.'
                  : `${detected.length.toString()} équipement${detected.length > 1 ? 's' : ''} détecté${detected.length > 1 ? 's' : ''} :`}
              </p>

              {detected.length > 0 && (
                <>
                  <ul className="space-y-1 mb-3 max-h-36 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                    {detected.map((d, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-800 truncate max-w-[70%]">
                          {d.text}
                        </span>
                        <span className="text-gray-500 text-right">
                          {d.widthModules} module{d.widthModules > 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Choix de la rangee */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs font-semibold text-gray-600 whitespace-nowrap" htmlFor="import-row">
                      Importer dans :
                    </label>
                    <select
                      id="import-row"
                      value={importedRowId}
                      onChange={(e) => setImportedRowId(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
                    >
                      {project.rows.map((row) => (
                        <option key={row.id} value={row.id}>
                          Rangée {row.index + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {importSuccess && (
                    <p className="text-xs text-green-700 font-bold mb-2">
                      Équipements importés avec succès !
                    </p>
                  )}

                  <button
                    onClick={handleImport}
                    className="w-full rounded bg-[#9B2020] px-4 py-2 text-sm font-bold text-white hover:bg-[#7a1a1a] transition"
                  >
                    Importer dans la rangée
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
