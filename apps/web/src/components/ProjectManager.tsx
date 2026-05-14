import { useRef, useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useProjectsStore } from '../store/projectsStore.js';
import type { SavedProject } from '../store/projectsStore.js';

interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${h}:${m}`;
}

export function ProjectManager({ open, onClose }: ProjectManagerProps): JSX.Element | null {
  const project = useProjectStore((s) => s.project);
  const projects = useProjectsStore((s) => s.projects);
  const saveCurrentProject = useProjectsStore((s) => s.saveCurrentProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const loadProjectById = useProjectsStore((s) => s.loadProject);
  const exportProjectJson = useProjectsStore((s) => s.exportProjectJson);
  const importProjectJson = useProjectsStore((s) => s.importProjectJson);

  const [importError, setImportError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleSave(): void {
    saveCurrentProject(project);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleLoad(id: string): void {
    const loaded = loadProjectById(id);
    if (loaded === undefined) return;
    try {
      localStorage.setItem('ceff-project', JSON.stringify(loaded));
      window.location.reload();
    } catch {
      // Storage error
    }
  }

  function handleDelete(id: string): void {
    deleteProject(id);
  }

  function handleExport(entry: SavedProject): void {
    exportProjectJson(entry.data);
  }

  async function handleImport(file: File): Promise<void> {
    setImportError(null);
    const loaded = await importProjectJson(file);
    if (loaded === null) {
      setImportError('Fichier JSON invalide ou non reconnu.');
      return;
    }
    try {
      localStorage.setItem('ceff-project', JSON.stringify(loaded));
      window.location.reload();
    } catch {
      setImportError('Erreur lors du chargement du projet.');
    }
  }

  function handleNewProject(): void {
    // Remove current project from localStorage so the store recreates the default
    try {
      localStorage.removeItem('ceff-project');
      window.location.reload();
    } catch {
      // Storage error
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
        {/* En-tete de la modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1F3864] text-white">
          <h2 className="text-base font-bold uppercase tracking-wide">Gestion des projets</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh]">
          {/* Actions globales */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded bg-[#1F3864] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#162a4e] transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l3 3v4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-6a1 1 0 00-1-1h-4a1 1 0 00-1 1v6" />
                <rect x="9" y="13" width="6" height="8" rx="0.5" />
              </svg>
              {saved ? 'Sauvegarde !' : 'Sauvegarder le projet actuel'}
            </button>
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouveau projet
            </button>
          </div>

          {/* Liste des projets */}
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              Aucun projet sauvegarde.
            </p>
          ) : (
            <ul className="space-y-2 mb-4">
              {projects.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{entry.name}</p>
                    <p className="text-xs text-gray-500 truncate">{entry.affaire || <em>Sans affaire</em>}</p>
                    <p className="text-xs text-gray-400">{formatDate(entry.updatedAt)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleLoad(entry.id)}
                      className="rounded bg-[#1F3864] px-2 py-1 text-xs font-bold text-white hover:bg-[#162a4e] transition"
                    >
                      Charger
                    </button>
                    <button
                      onClick={() => handleExport(entry)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded border border-[#C00000] px-2 py-1 text-xs font-bold text-[#C00000] hover:bg-red-50 transition"
                    >
                      Suppr.
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Import JSON */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Importer un projet JSON</p>
            {importError !== null && (
              <p className="text-xs text-[#C00000] font-bold mb-2">{importError}</p>
            )}
            <label className="inline-flex items-center gap-2 cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Importer JSON
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file !== undefined) {
                    void handleImport(file);
                  }
                  // Reset pour permettre de recharger le meme fichier
                  if (importRef.current !== null) importRef.current.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
