import { layoutProject, effectiveColorHex } from '@ceff/core';
import type { Project } from '@ceff/core';
import type { LayoutCell } from '@ceff/core';

interface PlanStripProps {
  project: Project;
  rowId: string;
}

export function PlanStrip({ project, rowId }: PlanStripProps): JSX.Element {
  const layout = layoutProject(project);
  const layoutRow = layout.rows.find((r) => r.rowId === rowId);

  const bgHex = effectiveColorHex(project.bgColor, project.customBgColorHex);
  const textHex = effectiveColorHex(project.textColor, project.customTextColorHex);
  const totalMm = layout.widthMm;

  if (!layoutRow) {
    return (
      <div className="h-8 w-full rounded bg-gray-100 border border-gray-200 text-xs text-gray-400 flex items-center justify-center">
        Rangée introuvable
      </div>
    );
  }

  return (
    <div
      className="relative flex h-12 w-full overflow-hidden rounded border border-gray-300"
      title={`Largeur totale : ${totalMm} mm`}
    >
      {layoutRow.cells.map((cell: LayoutCell, idx: number) => {
        const pct = (cell.widthMm / totalMm) * 100;

        if (cell.type === 'gap') {
          return (
            <div
              key={`gap-${idx}`}
              className="flex-shrink-0 h-full bg-gray-100 border-r border-dashed border-gray-300"
              style={{ width: `${pct}%` }}
              title={`Espace libre : ${cell.widthMm} mm`}
            />
          );
        }

        // cell.type === 'equipment'
        const lines = cell.text.split('\n');
        return (
          <div
            key={`eq-${cell.equipmentId}`}
            className="flex-shrink-0 h-full flex flex-col items-center justify-center border-r border-gray-400 px-0.5 overflow-hidden"
            style={{
              width: `${pct}%`,
              backgroundColor: bgHex,
              color: textHex,
              borderColor: textHex === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            }}
            title={`${cell.text} - ${cell.widthMm} mm`}
          >
            {lines.map((line, i) => (
              <span
                key={i}
                className="block text-center leading-tight"
                style={{
                  fontSize: '8px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {line}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
