import { create } from 'zustand';
import { ulid } from 'ulid';
import type { Project } from '@ceff/core';

const STORAGE_KEY = 'ceff-projects-list';

export interface SavedProject {
  id: string;
  name: string;
  affaire: string;
  updatedAt: number;
  data: Project;
}

interface ProjectsStore {
  projects: SavedProject[];
  saveCurrentProject: (project: Project) => void;
  loadProject: (id: string) => Project | undefined;
  deleteProject: (id: string) => void;
  exportProjectJson: (project: Project) => void;
  importProjectJson: (file: File) => Promise<Project | null>;
}

function loadFromStorage(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as SavedProject[];
      }
    }
  } catch {
    // Parsing error, use empty list
  }
  return [];
}

function saveToStorage(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Write error
  }
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: loadFromStorage(),

  saveCurrentProject: (project) => {
    set((state) => {
      const existing = state.projects.find((p) => p.id === project.id);
      let updated: SavedProject[];
      if (existing !== undefined) {
        updated = state.projects.map((p) =>
          p.id === project.id
            ? {
                id: project.id,
                name: project.name,
                affaire: project.affaire,
                updatedAt: Date.now(),
                data: project,
              }
            : p
        );
      } else {
        const newEntry: SavedProject = {
          id: project.id !== '' ? project.id : ulid(),
          name: project.name,
          affaire: project.affaire,
          updatedAt: Date.now(),
          data: project,
        };
        updated = [newEntry, ...state.projects];
      }
      saveToStorage(updated);
      return { projects: updated };
    });
  },

  loadProject: (id) => {
    const found = get().projects.find((p) => p.id === id);
    return found?.data;
  },

  deleteProject: (id) => {
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveToStorage(updated);
      return { projects: updated };
    });
  },

  exportProjectJson: (project) => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const slug = project.affaire.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'projet';
    anchor.href = url;
    anchor.download = `etiquetage-${slug}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  importProjectJson: async (file) => {
    return new Promise<Project | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = e.target?.result;
          if (typeof raw !== 'string') {
            resolve(null);
            return;
          }
          const parsed: unknown = JSON.parse(raw);
          if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'id' in parsed &&
            'schemaVersion' in parsed &&
            'rows' in parsed
          ) {
            resolve(parsed as Project);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  },
}));
