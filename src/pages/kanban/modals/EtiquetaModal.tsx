import React, { useState } from 'react';

interface EtiquetaModalProps {
  onClose: () => void;
  onSubmit: (nombre: string, colorHex: string, esGlobal: boolean) => Promise<void>;
}

export const EtiquetaModal: React.FC<EtiquetaModalProps> = ({ onClose, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [colorHex, setColorHex] = useState('#bfdbfe');
  const [esGlobal, setEsGlobal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await onSubmit(nombre.trim(), colorHex, esGlobal);
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
            <h5 className="modal-title fw-bold">Nueva Etiqueta</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre de la Etiqueta</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej: Bug, Feature, Urgente..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Color</label>
                <input
                  type="color"
                  className="form-control form-control-color w-100"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                />
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="esGlobalCheck"
                  checked={esGlobal}
                  onChange={(e) => setEsGlobal(e.target.checked)}
                />
                <label className="form-check-label fw-semibold text-secondary" htmlFor="esGlobalCheck">
                  Etiqueta Global (Disponible para todos los tableros)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Etiqueta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

