import React, { useState } from 'react';
import { getContrastColor } from '../utils/colorUtils';

const COLORS_PALETTE = [
  '#fca5a5', '#fdba74', '#86efac', '#7dd3fc', '#d8b4fe',
  '#fecaca', '#fed7aa', '#bbf7d0', '#bae6fd', '#e9d5ff',
  '#fbcfe8', '#fef08a', '#a7f3d0', '#bfdbfe', '#ddd6fe',
  '#f9a8d4', '#fde68a', '#d1fae5', '#a5f3fc', '#c4b5fd',
  '#fce7f3', '#fef9c3', '#dcfce7', '#e0f2fe', '#ede9fe',
  '#fee2e2', '#fff7ed', '#f0fdf4', '#f0f9ff', '#f3e8ff',
];

interface Props {
  submitLabel?: string;
  autoFocus?: boolean;
  onSubmit: (nombre: string, colorHex: string, colorTexto: string) => void;
}

export const EtiquetaCrearPanel: React.FC<Props> = ({
  submitLabel = 'Crear',
  autoFocus = false,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [colorHex, setColorHex] = useState('#bfdbfe');

  const colorTexto = getContrastColor(colorHex);

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onSubmit(nombre.trim(), colorHex, colorTexto);
    setNombre('');
    setColorHex('#bfdbfe');
  };

  return (
    <div>
      {/* Preview */}
      <div
        className="p-3 mb-3 rounded-2 text-center fw-bold d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: colorHex || '#cbd5e1',
          minHeight: 48,
          color: colorTexto,
          fontSize: '0.92rem',
        }}
      >
        {nombre || ''}
      </div>

      {/* Título */}
      <div className="mb-3">
        <label className="fw-bold text-secondary d-block mb-1" style={{ fontSize: '0.75rem' }}>Título</label>
        <input
          type="text"
          className="form-control form-control-sm border"
          autoFocus={autoFocus}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ borderRadius: 6 }}
        />
      </div>

      {/* Paleta */}
      <div className="mb-3">
        <label className="fw-bold text-secondary d-block mb-2" style={{ fontSize: '0.75rem' }}>Seleccionar un color</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {COLORS_PALETTE.map((c) => (
            <div
              key={c}
              onClick={() => setColorHex(c)}
              className="d-flex align-items-center justify-content-center"
              style={{
                aspectRatio: '1',
                backgroundColor: c,
                borderRadius: 6,
                cursor: 'pointer',
                border: colorHex === c ? '2px solid rgba(0,0,0,0.45)' : '1px solid rgba(0,0,0,0.08)',
                color: getContrastColor(c),
              }}
            >
              {colorHex === c && <i className="bi bi-check" />}
            </div>
          ))}
        </div>
      </div>

      {/* Quitar color */}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary w-100 mb-3 d-flex align-items-center justify-content-center gap-1"
        onClick={() => setColorHex('')}
        style={{ fontSize: '0.8rem', borderRadius: 6 }}
      >
        <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }} /> Quitar color
      </button>

      <hr className="my-3" />

      <button
        type="button"
        className="btn btn-primary btn-sm px-4 fw-semibold"
        onClick={handleSubmit}
        disabled={!nombre.trim()}
        style={{ borderRadius: 6 }}
      >
        {submitLabel}
      </button>
    </div>
  );
};
