import { useState, useCallback } from 'react';
import { generatePdf } from '@ceff/export-pdf';
import { useProjectStore } from '../store/projectStore.js';

function formatDateForFilename(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function slugifyAffaire(affaire: string): string {
  return affaire
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'projet';
}

/** Tente de charger le logo natif depuis /logo.png. Retourne undefined si absent. */
async function fetchNativeLogo(): Promise<Uint8Array | undefined> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return undefined;
  }
}

interface UsePdfExport {
  exporting: boolean;
  exportPdf: () => Promise<void>;
}

export function usePdfExport(): UsePdfExport {
  const [exporting, setExporting] = useState(false);
  const project = useProjectStore((state) => state.project);

  const exportPdf = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const logoBytes = await fetchNativeLogo();
      const bytes = await generatePdf(project, logoBytes);
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const affaireSlug = slugifyAffaire(project.affaire);
      const date = formatDateForFilename(new Date());
      const filename = `etiquetage-${affaireSlug}-${date}.pdf`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  }, [exporting, project]);

  return { exporting, exportPdf };
}
