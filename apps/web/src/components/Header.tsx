import { useState } from 'react';
import { usePdfExport } from '../hooks/usePdfExport.js';
import { useProjectStore } from '../store/projectStore.js';
import { useProjectsStore } from '../store/projectsStore.js';
import { ProjectManager } from './ProjectManager.js';
import { AiDetection } from './AiDetection.js';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps): JSX.Element {
  const { exporting, exportPdf } = usePdfExport();
  const project = useProjectStore((s) => s.project);
  const saveCurrentProject = useProjectsStore((s) => s.saveCurrentProject);

  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showAiDetection, setShowAiDetection] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [logoError, setLogoError] = useState(false);

  function handleSave(): void {
    saveCurrentProject(project);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <>
      <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-[#1F3864] text-white shadow-md">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Bouton hamburger — mobile uniquement */}
          <button
            onClick={onToggleSidebar}
            title="Paramètres"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-white/10 hover:bg-white/20 transition md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {!logoError ? (
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo"
              className="h-8 md:h-10 object-contain flex-shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-xl md:text-2xl font-bold tracking-widest text-white flex-shrink-0">CEFF</span>
          )}

          <div className="hidden md:block h-6 w-px bg-white/40 flex-shrink-0" />

          <span className="hidden sm:block text-xs md:text-base font-semibold uppercase tracking-wide truncate">
            Etiquetage Tableau Modulaire
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* Bouton IA */}
          <button
            onClick={() => setShowAiDetection(true)}
            title="Analyser photo (IA)"
            className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20 transition md:w-auto md:gap-1.5 md:px-3"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span className="hidden md:inline text-sm font-bold">Analyser photo</span>
          </button>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            title="Sauvegarder le projet"
            className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20 transition md:w-auto md:gap-1.5 md:px-3"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H7a2 2 0 00-2 2v14l7-3 7 3V5a2 2 0 00-2-2z" />
            </svg>
            <span className="hidden md:inline text-sm font-bold">{savedFlash ? 'Sauvegarde !' : 'Sauvegarder'}</span>
          </button>

          {/* Bouton Projets */}
          <button
            onClick={() => setShowProjectManager(true)}
            title="Gérer les projets"
            className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20 transition md:w-auto md:gap-1.5 md:px-3"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <span className="hidden md:inline text-sm font-bold">Projets</span>
          </button>

          {/* Bouton Exporter PDF */}
          <button
            onClick={() => void exportPdf()}
            disabled={exporting}
            className="flex h-9 items-center gap-1.5 rounded bg-white px-2 md:px-4 text-sm font-bold text-[#1F3864] transition hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1F3864] border-t-transparent flex-shrink-0" />
                <span className="hidden sm:inline">Generation...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                  />
                </svg>
                <span className="hidden sm:inline">Exporter PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Modales */}
      <ProjectManager open={showProjectManager} onClose={() => setShowProjectManager(false)} />
      <AiDetection open={showAiDetection} onClose={() => setShowAiDetection(false)} />
    </>
  );
}
