import React, { useState } from 'react';

interface EstadoModalProps {
  onClose: () => void;
  onSubmit: (nombre: string, colorHex: string, orden: number) => Promise<void>;
  nextOrden: number;
}

const COLOR_PRESETS = [
  '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f59e0b', '#10b981', '#64748b',
];

export const EstadoModal: React.FC<EstadoModalProps> = ({ onClose, onSubmit, nextOrden }) => {
  const [nombre, setNombre] = useState('');
  const [colorHex, setColorHex] = useState('#0ea5e9');
  const [sinColor, setSinColor] = useState(false);
  const [orden, setOrden] = useState(nextOrden);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await onSubmit(nombre.trim(), sinColor ? '' : colorHex, orden);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Nueva Columna / Estado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre del Estado</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej: En Revisión, QA..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label fw-semibold mb-0">Color de la columna</label>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sinColor"
                      checked={sinColor}
                      onChange={(e) => setSinColor(e.target.checked)}
                    />
                    <label className="form-check-label text-muted small" htmlFor="sinColor">
                      Sin color
                    </label>
                  </div>
                </div>

                {!sinColor && (
                  <div>
                    {/* Presets */}
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColorHex(c)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: c,
                            border: colorHex === c ? '3px solid #1e293b' : '2px solid transparent',
                            cursor: 'pointer', outline: 'none', padding: 0,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                      {/* Custom color picker */}
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        title="Color personalizado"
                        style={{ width: 28, height: 28, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                      />
                    </div>
                    {/* Preview */}
                    <div
                      className="rounded-2 border"
                      style={{ height: 6, backgroundColor: colorHex, marginTop: 4 }}
                    />
                  </div>
                )}

                {sinColor && (
                  <p className="text-muted small fst-italic mb-0">
                    La columna no tendrá color en la parte superior.
                  </p>
                )}
              </div>

              <div className="mb-1">
                <label className="form-label fw-semibold">Orden / Posición</label>
                <input
                  type="number"
                  className="form-control"
                  value={orden}
                  onChange={(e) => setOrden(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Columna'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
