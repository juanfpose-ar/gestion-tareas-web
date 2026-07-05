import React, { useState } from 'react';
import { EstadoTablero, Etiqueta, Prioridad } from '../../../types';

interface TicketCreateModalProps {
  initialEstadoId: number;
  estados: EstadoTablero[];
  etiquetas: Etiqueta[];
  onClose: () => void;
  onSubmit: (data: {
    titulo: string;
    descripcion?: string;
    prioridad: Prioridad;
    estadoId: number;
    etiquetasIds?: number[];
  }) => Promise<void>;
}

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({
  initialEstadoId,
  estados,
  etiquetas,
  onClose,
  onSubmit
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad>(Prioridad.MEDIA);
  const [estadoId, setEstadoId] = useState<number>(initialEstadoId);
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        prioridad,
        estadoId,
        etiquetasIds: selectedEtiquetas
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleEtiqueta = (id: number) => {
    setSelectedEtiquetas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Nuevo Ticket</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Título</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Título de la tarea"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Descripción</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Detalles del ticket..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                ></textarea>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Prioridad</label>
                  <select
                    className="form-select"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="URGENTE">URGENTE</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Columna / Estado</label>
                  <select
                    className="form-select"
                    value={estadoId}
                    onChange={(e) => setEstadoId(Number(e.target.value))}
                  >
                    {estados.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {etiquetas.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold d-block">Etiquetas</label>
                  <div className="d-flex flex-wrap gap-2">
                    {etiquetas.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`btn btn-sm ${
                          selectedEtiquetas.includes(tag.id) ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => toggleEtiqueta(tag.id)}
                      >
                        {tag.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
