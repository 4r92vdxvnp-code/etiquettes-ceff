import { useProjectStore } from '../store/projectStore.js';
import type { Row, Project } from '@ceff/core';
import { PlanStrip } from './PlanStrip.js';
import { EquipmentEditor } from './EquipmentEditor.js';

interface RowEditorProps {
  row: Row;
  project: Project;
  isFirst: boolean;
  isLast: boolean;
}

export function RowEditor({ row, project, isFirst, isLast }: RowEditorProps): JSX.Element {
  const removeRow = useProjectStore((s) => s.removeRow);
  const moveRowUp = useProjectStore((s) => s.moveRowUp);
  const moveRowDown = useProjectStore((s) => s.moveRowDown);
  const addEquipment = useProjectStore((s) => s.addEquipment);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* En-tete */}
      <div className="flex items-center justify-between rounded-t-lg bg-[#1F3864]/10 px-3 py-2">
        <span className="text-sm font-bold text-[#1F3864]">
          Rangée {row.index + 1}
        </span>
        <div className="flex items-center gap-1">
          {/* Monter */}
          <button
            onClick={() => moveRowUp(row.id)}
            disabled={isFirst}
            title="Déplacer vers le haut"
            className="flex h-7 w-7 items-center justify-center rounded text-[#1F3864] hover:bg-[#1F3864]/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Descendre */}
          <button
            onClick={() => moveRowDown(row.id)}
            disabled={isLast}
            title="Déplacer vers le bas"
            className="flex h-7 w-7 items-center justify-center rounded text-[#1F3864] hover:bg-[#1F3864]/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Supprimer */}
          <button
            onClick={() => removeRow(row.id)}
            title="Supprimer la rangée"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-[#C00000] transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Plan visuel de la rangee */}
        <PlanStrip project={project} rowId={row.id} />

        {/* Liste des equipements */}
        {row.equipments.length > 0 && (
          <div className="space-y-2">
            {row.equipments
              .slice()
              .sort((a, b) => a.positionHalfModules - b.positionHalfModules)
              .map((eq) => (
                <EquipmentEditor
                  key={eq.id}
                  equipment={eq}
                  rowId={row.id}
                  project={project}
                />
              ))}
          </div>
        )}

        {row.equipments.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-2">
            Aucun equipement - rangee vide
          </p>
        )}

        {/* Bouton ajouter equipement */}
        <button
          onClick={() => addEquipment(row.id)}
          className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#1F3864]/40 py-1.5 text-xs font-semibold text-[#1F3864] hover:border-[#1F3864] hover:bg-[#1F3864]/5 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Équipement
        </button>
      </div>
    </div>
  );
}
