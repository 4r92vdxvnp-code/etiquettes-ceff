import { useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import type { LabelColor, LabelHeightMm } from '@ceff/core';
import { LABEL_HEIGHTS_MM, LABEL_COLORS, LABEL_COLOR_LABEL, effectiveColorHex } from '@ceff/core';

const TABLE_WIDTHS_MODULES = [12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] as const;

export function Sidebar(): JSX.Element {
  const project = useProjectStore((s) => s.project);
  const setAffaire = useProjectStore((s) => s.setAffaire);
  const setWidthModules = useProjectStore((s) => s.setWidthModules);
  const setHeightMm = useProjectStore((s) => s.setHeightMm);
  const setBgColor = useProjectStore((s) => s.setBgColor);
  const setTextColor = useProjectStore((s) => s.setTextColor);
  const setCustomBgColorHex = useProjectStore((s) => s.setCustomBgColorHex);
  const setCustomTextColorHex = useProjectStore((s) => s.setCustomTextColorHex);

  const [freeWidthStr, setFreeWidthStr] = useState('');
  const [freeHeightStr, setFreeHeightStr] = useState('');

  const isCustomWidth = !TABLE_WIDTHS_MODULES.includes(project.widthModules as typeof TABLE_WIDTHS_MODULES[number]);
  const isCustomHeight = !(LABEL_HEIGHTS_MM as readonly number[]).includes(project.heightMm);

  const bgHex = effectiveColorHex(project.bgColor, project.customBgColorHex);
  const textHex = effectiveColorHex(project.textColor, project.customTextColorHex);
  const colorConflict = bgHex.toLowerCase() === textHex.toLowerCase();

  function handleFreeWidth(val: string): void {
    setFreeWidthStr(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setWidthModules(n);
  }

  function handleFreeHeight(val: string): void {
    setFreeHeightStr(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setHeightMm(n as LabelHeightMm);
  }

  return (
    <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1F3864]">
        Parametres du tableau
      </h2>

      {/* Affaire */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="affaire">
          Affaire
        </label>
        <input
          id="affaire"
          type="text"
          value={project.affaire}
          onChange={(e) => setAffaire(e.target.value)}
          placeholder="Lycee Camille Claudel..."
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        />
      </div>

      {/* Largeur */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="widthModules">
          Largeur du tableau
        </label>
        <select
          id="widthModules"
          value={isCustomWidth ? '' : project.widthModules}
          onChange={(e) => {
            if (e.target.value === '') return;
            setWidthModules(Number(e.target.value));
            setFreeWidthStr('');
          }}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        >
          {isCustomWidth && (
            <option value="">{project.widthModules} modules (personnalise)</option>
          )}
          {TABLE_WIDTHS_MODULES.map((w) => (
            <option key={w} value={w}>
              {w} modules ({w * 18} mm)
            </option>
          ))}
        </select>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 shrink-0">Valeur libre :</span>
          <input
            type="number"
            min={1}
            max={36}
            value={isCustomWidth ? project.widthModules : freeWidthStr}
            onChange={(e) => handleFreeWidth(e.target.value)}
            placeholder="ex: 15"
            className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs text-right focus:border-[#1F3864] focus:outline-none"
          />
          <span className="text-[10px] text-gray-400 shrink-0">mod.</span>
        </div>
      </div>

      {/* Hauteur etiquette */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="heightMm">
          Hauteur etiquette
        </label>
        <select
          id="heightMm"
          value={isCustomHeight ? '' : project.heightMm}
          onChange={(e) => {
            if (e.target.value === '') return;
            setHeightMm(Number(e.target.value) as LabelHeightMm);
            setFreeHeightStr('');
          }}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        >
          {isCustomHeight && (
            <option value="">{project.heightMm} mm (personnalise)</option>
          )}
          {LABEL_HEIGHTS_MM.map((h) => (
            <option key={h} value={h}>
              {h} mm
            </option>
          ))}
        </select>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 shrink-0">Valeur libre :</span>
          <input
            type="number"
            min={1}
            max={500}
            value={isCustomHeight ? project.heightMm : freeHeightStr}
            onChange={(e) => handleFreeHeight(e.target.value)}
            placeholder="ex: 25"
            className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs text-right focus:border-[#1F3864] focus:outline-none"
          />
          <span className="text-[10px] text-gray-400 shrink-0">mm</span>
        </div>
      </div>

      {/* Couleur de fond */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="bgColor">
          Fond des etiquettes
        </label>
        <select
          id="bgColor"
          value={project.bgColor}
          onChange={(e) => setBgColor(e.target.value as LabelColor)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        >
          {LABEL_COLORS.map((c) => (
            <option key={c} value={c}>
              {LABEL_COLOR_LABEL[c]}
            </option>
          ))}
        </select>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-sm border border-gray-400 shrink-0"
            style={{ backgroundColor: bgHex }}
          />
          <span className="text-xs text-gray-500">{bgHex}</span>
        </div>
        {project.bgColor === 'personnalise' && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] text-gray-500 shrink-0">Couleur libre :</span>
            <input
              type="color"
              value={project.customBgColorHex ?? '#000000'}
              onChange={(e) => setCustomBgColorHex(e.target.value)}
              className="h-7 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
            />
            <span className="text-xs text-gray-500">{project.customBgColorHex ?? '#000000'}</span>
          </div>
        )}
      </div>

      {/* Couleur de texte */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700" htmlFor="textColor">
          Texte des etiquettes
        </label>
        <select
          id="textColor"
          value={project.textColor}
          onChange={(e) => setTextColor(e.target.value as LabelColor)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1F3864] focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
        >
          {LABEL_COLORS.map((c) => (
            <option key={c} value={c}>
              {LABEL_COLOR_LABEL[c]}
            </option>
          ))}
        </select>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-sm border border-gray-400 shrink-0"
            style={{ backgroundColor: textHex }}
          />
          <span className="text-xs text-gray-500">{textHex}</span>
        </div>
        {project.textColor === 'personnalise' && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] text-gray-500 shrink-0">Couleur libre :</span>
            <input
              type="color"
              value={project.customTextColorHex ?? '#ffffff'}
              onChange={(e) => setCustomTextColorHex(e.target.value)}
              className="h-7 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
            />
            <span className="text-xs text-gray-500">{project.customTextColorHex ?? '#ffffff'}</span>
          </div>
        )}
      </div>

      {/* Avertissement conflit de couleurs */}
      {colorConflict && (
        <div
          role="alert"
          className="rounded border border-[#C00000] bg-red-50 px-3 py-2 text-xs font-bold text-[#C00000]"
        >
          Attention : fond et texte de meme couleur - le texte sera invisible sur l&apos;etiquette.
        </div>
      )}

      {/* Recapitulatif */}
      <div className="mt-6 rounded border border-gray-200 bg-white p-3 text-xs text-gray-500">
        <p className="font-semibold text-gray-700">Recapitulatif</p>
        <p className="mt-1">
          {project.widthModules} modules &times; {project.widthModules * 18} mm
        </p>
        <p>{project.rows.length} rangee{project.rows.length > 1 ? 's' : ''}</p>
        <p>Hauteur : {project.heightMm} mm</p>
      </div>
    </aside>
  );
}
