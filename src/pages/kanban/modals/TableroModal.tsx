import React, { useState } from 'react';
import { BACKGROUNDS } from '../../../config/backgrounds';

interface TableroModalProps {
  onClose: () => void;
  onSubmit: (nombre: string, descripcion?: string, imagenFondoUrl?: string) => Promise<void>;
}

export const TableroModal: React.FC<TableroModalProps> = ({ onClose, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await onSubmit(nombre.trim(), descripcion.trim() || undefined, selectedBg ?? undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Nuevo Tablero</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre del Tablero</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej: Proyecto Alfa"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Descripción (opcional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Descripción del proyecto..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                ></textarea>
              </div>

              {/* Selector de imagen de fondo */}
              <div className="mb-1">
                <label className="form-label fw-semibold">Imagen de fondo</label>
              </div>

              {/* Preview de la selección */}
              {selectedBg && (
                <div
                  className="rounded mb-3 d-flex align-items-end p-2"
                  style={{
                    height: 100,
                    backgroundImage: `url(${selectedBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <span className="badge bg-dark bg-opacity-75 small">
                    {BACKGROUNDS.find((b) => b.path === selectedBg)?.label}
                  </span>
                </div>
              )}

              <div
                className="d-grid gap-2"
                style={{ gridTemplateColumns: 'repeat(5, 1fr)', display: 'grid' }}
              >
                {/* Opción "Sin imagen" */}
                <div
                  onClick={() => setSelectedBg(null)}
                  className={`rounded border d-flex align-items-center justify-content-center text-muted small`}
                  style={{
                    height: 54,
                    cursor: 'pointer',
                    outline: selectedBg === null ? '2px solid #0d6efd' : '2px solid transparent',
                    background: 'repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 4px,#fff 4px,#fff 10px)',
                  }}
                  title="Sin imagen"
                >
                  <i className="bi bi-x-lg"></i>
                </div>

                {BACKGROUNDS.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.path)}
                    title={bg.label}
                    className="rounded border"
                    style={{
                      height: 54,
                      cursor: 'pointer',
                      backgroundImage: `url(${bg.path})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      outline: selectedBg === bg.path ? '2px solid #0d6efd' : '2px solid transparent',
                      transition: 'outline 0.1s',
                    }}
                  />
                ))}
              </div>
              <p className="text-muted small mt-1 mb-0">
                Imágenes: lugares de Argentina.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Tablero'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
