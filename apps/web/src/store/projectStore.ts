import { create } from 'zustand';
import { ulid } from 'ulid';
import type { Project, Row, Equipment, LabelColor, LabelHeightMm } from '@ceff/core';
import { sanitizeLabelText } from '@ceff/core';

// Cle de stockage localStorage
const STORAGE_KEY = 'ceff-project';

// Projet initial par defaut
function createDefaultProject(): Project {
  const now = Date.now();
  const projectId = ulid();
  const rowId = ulid();

  const equipments: Equipment[] = [
    {
      id: ulid(),
      rowId,
      positionHalfModules: 0,
      widthHalfModules: 8,
      text: sanitizeLabelText('DISJONCTEUR\nGENERAL'),
    },
    {
      id: ulid(),
      rowId,
      positionHalfModules: 8,
      widthHalfModules: 4,
      text: sanitizeLabelText('PRISE\n16A'),
    },
    {
      id: ulid(),
      rowId,
      positionHalfModules: 12,
      widthHalfModules: 4,
      text: sanitizeLabelText('PRISE\n16A'),
    },
    {
      id: ulid(),
      rowId,
      positionHalfModules: 16,
      widthHalfModules: 4,
      text: sanitizeLabelText('ECLAIRAGE'),
    },
  ];

  const row: Row = {
    id: rowId,
    index: 0,
    equipments,
  };

  return {
    id: projectId,
    name: 'Nouveau projet',
    affaire: '',
    widthModules: 18,
    heightMm: 30,
    bgColor: 'blanc',
    textColor: 'noir',
    rows: [row],
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

// Charge depuis localStorage si disponible
function loadFromStorage(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      // Validation minimale de structure
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'id' in parsed &&
        'schemaVersion' in parsed
      ) {
        return parsed as Project;
      }
    }
  } catch {
    // En cas d'erreur de parsing, on repart du defaut
  }
  return createDefaultProject();
}

interface ProjectStore {
  project: Project;
  setAffaire: (affaire: string) => void;
  setWidthModules: (w: number) => void;
  setHeightMm: (h: LabelHeightMm) => void;
  setBgColor: (c: LabelColor) => void;
  setTextColor: (c: LabelColor) => void;
  setCustomBgColorHex: (hex: string) => void;
  setCustomTextColorHex: (hex: string) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
  moveRowUp: (rowId: string) => void;
  moveRowDown: (rowId: string) => void;
  addEquipment: (rowId: string) => void;
  addEquipmentsFromDetection: (rowId: string, items: Array<{ text: string; widthHalfModules: number }>) => void;
  updateEquipmentText: (rowId: string, equipmentId: string, text: string) => void;
  updateEquipmentWidth: (
    rowId: string,
    equipmentId: string,
    widthHalfModules: number
  ) => void;
  updateEquipmentPosition: (
    rowId: string,
    equipmentId: string,
    positionHalfModules: number
  ) => void;
  removeEquipment: (rowId: string, equipmentId: string) => void;
  setEquipmentWidthMm: (rowId: string, equipmentId: string, widthMm: number) => void;
  clearEquipmentWidthMm: (rowId: string, equipmentId: string) => void;
}

// Helper pour recalculer les index apres reordonnancement
function reindexRows(rows: Row[]): Row[] {
  return rows.map((row, idx) => ({ ...row, index: idx }));
}

// Helper pour mettre a jour updatedAt
function withUpdatedAt(project: Project): Project {
  return { ...project, updatedAt: Date.now() };
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: loadFromStorage(),

  setAffaire: (affaire) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, affaire }),
    })),

  setWidthModules: (widthModules) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, widthModules }),
    })),

  setHeightMm: (heightMm) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, heightMm }),
    })),

  setBgColor: (bgColor) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, bgColor }),
    })),

  setTextColor: (textColor) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, textColor }),
    })),

  setCustomBgColorHex: (customBgColorHex) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, customBgColorHex }),
    })),

  setCustomTextColorHex: (customTextColorHex) =>
    set((state) => ({
      project: withUpdatedAt({ ...state.project, customTextColorHex }),
    })),

  addRow: () =>
    set((state) => {
      const newRowId = ulid();
      const newRow: Row = {
        id: newRowId,
        index: state.project.rows.length,
        equipments: [],
      };
      return {
        project: withUpdatedAt({
          ...state.project,
          rows: [...state.project.rows, newRow],
        }),
      };
    }),

  removeRow: (rowId) =>
    set((state) => {
      const filtered = state.project.rows.filter((r) => r.id !== rowId);
      return {
        project: withUpdatedAt({
          ...state.project,
          rows: reindexRows(filtered),
        }),
      };
    }),

  moveRowUp: (rowId) =>
    set((state) => {
      const rows = [...state.project.rows];
      const idx = rows.findIndex((r) => r.id === rowId);
      if (idx <= 0) return state;
      const prev = rows[idx - 1];
      const curr = rows[idx];
      if (prev === undefined || curr === undefined) return state;
      rows[idx - 1] = curr;
      rows[idx] = prev;
      return {
        project: withUpdatedAt({
          ...state.project,
          rows: reindexRows(rows),
        }),
      };
    }),

  moveRowDown: (rowId) =>
    set((state) => {
      const rows = [...state.project.rows];
      const idx = rows.findIndex((r) => r.id === rowId);
      if (idx < 0 || idx >= rows.length - 1) return state;
      const curr = rows[idx];
      const next = rows[idx + 1];
      if (curr === undefined || next === undefined) return state;
      rows[idx] = next;
      rows[idx + 1] = curr;
      return {
        project: withUpdatedAt({
          ...state.project,
          rows: reindexRows(rows),
        }),
      };
    }),

  addEquipment: (rowId) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        // Place le nouvel equipement apres le dernier equipement existant
        const nextPosition = row.equipments.reduce(
          (max, eq) => Math.max(max, eq.positionHalfModules + eq.widthHalfModules),
          0
        );
        const newEquipment: Equipment = {
          id: ulid(),
          rowId,
          positionHalfModules: nextPosition,
          widthHalfModules: 2,
          text: sanitizeLabelText('NOUVEL\nEQUIPEMENT'),
        };
        return { ...row, equipments: [...row.equipments, newEquipment] };
      });
      return {
        project: withUpdatedAt({ ...state.project, rows }),
      };
    }),

  addEquipmentsFromDetection: (rowId, items) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        let nextPosition = row.equipments.reduce(
          (max, eq) => Math.max(max, eq.positionHalfModules + eq.widthHalfModules),
          0
        );
        const newEquipments: Equipment[] = items.map((item) => {
          const eq: Equipment = {
            id: ulid(),
            rowId,
            positionHalfModules: nextPosition,
            widthHalfModules: item.widthHalfModules,
            text: sanitizeLabelText(item.text),
          };
          nextPosition += item.widthHalfModules;
          return eq;
        });
        return { ...row, equipments: [...row.equipments, ...newEquipments] };
      });
      return { project: withUpdatedAt({ ...state.project, rows }) };
    }),

  updateEquipmentText: (rowId, equipmentId, text) =>
    set((state) => {
      const sanitized = sanitizeLabelText(text);
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.map((eq) =>
          eq.id === equipmentId ? { ...eq, text: sanitized } : eq
        );
        return { ...row, equipments };
      });
      return {
        project: withUpdatedAt({ ...state.project, rows }),
      };
    }),

  updateEquipmentWidth: (rowId, equipmentId, widthHalfModules) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.map((eq) =>
          eq.id === equipmentId ? { ...eq, widthHalfModules } : eq
        );
        return { ...row, equipments };
      });
      return {
        project: withUpdatedAt({ ...state.project, rows }),
      };
    }),

  updateEquipmentPosition: (rowId, equipmentId, positionHalfModules) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.map((eq) =>
          eq.id === equipmentId ? { ...eq, positionHalfModules } : eq
        );
        return { ...row, equipments };
      });
      return {
        project: withUpdatedAt({ ...state.project, rows }),
      };
    }),

  removeEquipment: (rowId, equipmentId) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.filter((eq) => eq.id !== equipmentId);
        return { ...row, equipments };
      });
      return {
        project: withUpdatedAt({ ...state.project, rows }),
      };
    }),

  setEquipmentWidthMm: (rowId, equipmentId, widthMm) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.map((eq) => {
          if (eq.id !== equipmentId) return eq;
          const widthHalfModules = Math.max(1, Math.round(widthMm / 9));
          return { ...eq, widthHalfModules, widthMm };
        });
        return { ...row, equipments };
      });
      return { project: withUpdatedAt({ ...state.project, rows }) };
    }),

  clearEquipmentWidthMm: (rowId, equipmentId) =>
    set((state) => {
      const rows = state.project.rows.map((row) => {
        if (row.id !== rowId) return row;
        const equipments = row.equipments.map((eq) => {
          if (eq.id !== equipmentId) return eq;
          const { widthMm: _removed, ...rest } = eq;
          void _removed;
          return rest;
        });
        return { ...row, equipments };
      });
      return { project: withUpdatedAt({ ...state.project, rows }) };
    }),
}));

// Abonnement pour sauvegarder dans localStorage a chaque changement
useProjectStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
  } catch {
    // Erreur d'ecriture localStorage (quota depassé, mode privé)
  }
});
