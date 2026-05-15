import { useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { validateProject } from '@ceff/core';
import type { Equipment, Project } from '@ceff/core';

interface EquipmentEditorProps {
  equipment: Equipment;
  rowId: string;
  project: Project;
}

const WIDTH_OPTIONS: { hm: number; label: string }[] = [
  { hm: 1,  label: '1/2 module - 9 mm'    },
  { hm: 2,  label: '1 module - 18 mm'     },
  { hm: 4,  label: '2 modules - 36 mm'    },
  { hm: 6,  label: '3 modules - 54 mm'    },
  { hm: 8,  label: '4 modules - 72 mm'    },
  { hm: 10, label: '5 modules - 90 mm'    },
  { hm: 12, label: '6 modules - 108 mm'   },
  { hm: 16, label: '8 modules - 144 mm'   },
  { hm: 18, label: '9 modules - 162 mm'   },
  { hm: 24, label: '12 modules - 216 mm'  },
];

export function EquipmentEditor({ equipment, rowId, project }: EquipmentEditorProps): JSX.Element {
  const updateEquipmentText     = useProjectStore((s) => s.updateEquipmentText);
  const updateEquipmentWidth    = useProjectStore((s) => s.updateEquipmentWidth);
  const updateEquipmentPosition = useProjectStore((s) => s.updateEquipmentPosition);
  const removeEquipment         = useProjectStore((s) => s.removeEquipment);
  const setEquipmentWidthMm     = useProjectStore((s) => s.setEquipmentWidthMm);
  const clearEquipmentWidthMm   = useProjectStore((s) => s.clearEquipmentWidthMm);

  const [editingPos, setEditingPos] = useState(false);
  const [customMmStr, setCustomMmStr] = useState(
    equipment.widthMm !== undefined ? String(equipment.widthMm) : ''
  );

  const validationResult = validateProject(project);
  const row = project.rows.find((r) => r.id === rowId);
  const hasError =
    !validationResult.ok &&
    row !== undefined &&
    validationResult.errors.some(
      (e) =>
        (e.path !== undefined && e.path.includes(equipment.id)) ||
        (e.code === 'EQUIPMENTS_OVERLAP' && row.equipments.some((eq) => eq.id === equipment.id))
    );
  const errorMessages = validationResult.ok
    ? []
    : validationResult.errors.filter(
        (e) =>
          (e.path !== undefined && e.path.includes(equipment.id)) ||
          (e.code === 'EQUIPMENTS_OVERLAP' &&
            row?.equipments.some((eq) => eq.id === equipment.id))
      );

  const positionMm = equipment.positionHalfModules * 9;
  const displayWidthMm = equipment.widthMm ?? equipment.widthHalfModules * 9;

  function handleSelectWidth(hm: number) {
    updateEquipmentWidth(rowId, equipment.id, hm);
    clearEquipmentWidthMm(rowId, equipment.id);
    setCustomMmStr('');
  }

  function handleCustomMmChange(value: string) {
    setCustomMmStr(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setEquipmentWidthMm(rowId, equipment.id, num);
    } else if (value === '') {
      clearEquipmentWidthMm(rowId, equipment.id);
    }
  }

  return (
    <div
      className={`rounded border p-2 space-y-2 ${
        hasError ? 'border-[#C00000] bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Ligne libellé + bouton supprimer */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <label className="mb-0.5 block text-xs text-gray-500">Libellé</label>
          <textarea
            rows={2}
            value={equipment.text}
            onChange={(e) => updateEquipmentText(rowId, equipment.id, e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono resize-none focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
            placeholder={"Ligne 1\nLigne 2"}
          />
        </div>

        {/* Supprimer */}
        <button
          onClick={() => removeEquipment(rowId, equipment.id)}
          title="Supprimer l'équipement"
          className="mt-5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-gray-300 text-gray-400 hover:border-[#C00000] hover:bg-red-50 hover:text-[#C00000] transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Ligne largeur */}
      <div className="space-y-1">
        <label className="mb-0.5 block text-xs text-gray-500">Largeur</label>
        <select
          value={equipment.widthHalfModules}
          onChange={(e) => handleSelectWidth(Number(e.target.value))}
          className="w-full rounded border border-gray-300 px-1.5 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        >
          {WIDTH_OPTIONS.find((o) => o.hm === equipment.widthHalfModules) === undefined && (
            <option value={equipment.widthHalfModules}>
              {equipment.widthHalfModules} × 9 mm (personnalisé)
            </option>
          )}
          {WIDTH_OPTIONS.map((o) => (
            <option key={o.hm} value={o.hm}>{o.label}</option>
          ))}
        </select>

        {/* Champ libre mm */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 shrink-0">ou exactement :</span>
          <input
            type="number"
            min={1}
            step={0.5}
            value={customMmStr}
            onChange={(e) => handleCustomMmChange(e.target.value)}
            placeholder="mm"
            className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs text-right focus:border-[#1F3864] focus:outline-none"
          />
          <span className="text-[10px] text-gray-400 shrink-0">mm</span>
        </div>
        {equipment.widthMm !== undefined && (
          <p className="text-[10px] text-[#1F3864]">
            Mesure exacte : {equipment.widthMm} mm
          </p>
        )}
      </div>

      {/* Infos position */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {editingPos ? (
          <>
            <span className="shrink-0 text-gray-500">Pos. module :</span>
            <input
              type="number"
              min={0}
              max={project.widthModules * 2 - 1}
              value={equipment.positionHalfModules}
              onChange={(e) => updateEquipmentPosition(rowId, equipment.id, Number(e.target.value))}
              className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-right focus:border-[#1F3864] focus:outline-none"
              autoFocus
              onBlur={() => setEditingPos(false)}
            />
            <span className="text-gray-400">× 9 mm = {positionMm} mm</span>
          </>
        ) : (
          <>
            <span>
              Position : <strong className="text-gray-600">{positionMm} mm</strong>
              {' · '}
              Largeur : <strong className="text-gray-600">{displayWidthMm} mm</strong>
            </span>
            <button
              onClick={() => setEditingPos(true)}
              className="ml-auto text-[10px] text-[#1F3864] underline hover:no-underline"
            >
              Modifier pos.
            </button>
          </>
        )}
      </div>

      {/* Erreurs */}
      {errorMessages.length > 0 && (
        <div>
          {errorMessages.map((e, i) => (
            <p key={i} className="text-xs font-semibold text-[#C00000]">⚠ {e.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
