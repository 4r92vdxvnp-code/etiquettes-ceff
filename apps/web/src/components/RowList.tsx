import { useProjectStore } from '../store/projectStore.js';
import { RowEditor } from './RowEditor.js';

export function RowList(): JSX.Element {
  const project = useProjectStore((s) => s.project);
  const addRow = useProjectStore((s) => s.addRow);

  const sortedRows = project.rows.slice().sort((a, b) => a.index - b.index);

  return (
    <div className="flex flex-col gap-4">
      {sortedRows.map((row, i) => (
        <RowEditor
          key={row.id}
          row={row}
          project={project}
          isFirst={i === 0}
          isLast={i === sortedRows.length - 1}
        />
      ))}

      {/* Bouton ajouter une rangee */}
      <button
        onClick={addRow}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-400 hover:border-[#1F3864] hover:text-[#1F3864] transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ajouter une rangée
      </button>
    </div>
  );
}
