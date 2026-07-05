import React from 'react';
import { NotaTarea } from '../../../../types';

interface Props {
  notas: NotaTarea[];
  newNota: string;
  onNewNotaChange: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
  editingNotaId: number | null;
  editingNotaTexto: string;
  onEditingTextoChange: (v: string) => void;
  onStartEdit: (nota: NotaTarea) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  confirmDeleteNotaId: number | null;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  isEditAllowed: (fechaCreacion?: string) => boolean;
}

export const NotasSection: React.FC<Props> = ({
  notas, newNota, onNewNotaChange, onAdd,
  editingNotaId, editingNotaTexto, onEditingTextoChange,
  onStartEdit, onSaveEdit, onCancelEdit,
  confirmDeleteNotaId, onRequestDelete, onConfirmDelete, onCancelDelete,
  isEditAllowed,
}) => (
  <div className="mb-4">
    <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
      <i className="bi bi-chat-left-text me-1" /> NOTAS ({notas.length})
    </div>

    <form onSubmit={onAdd} className="mb-3">
      <textarea
        className="form-control form-control-sm mb-2 border-0 border-bottom rounded-0"
        rows={2}
        placeholder="Añadir una nota..."
        value={newNota}
        onChange={(e) => onNewNotaChange(e.target.value)}
      />
      <button type="submit" className="btn btn-sm text-white px-3" style={{ backgroundColor: '#e91e63', fontWeight: 600 }}>
        Guardar nota
      </button>
    </form>

    <div className="d-flex flex-column gap-2">
      {notas.map((n, idx) => (
        <div key={n.id} className="p-3 bg-light rounded-3">
          {editingNotaId === n.id ? (
            <div>
              <textarea
                className="form-control form-control-sm mb-2 bg-white"
                rows={3}
                value={editingNotaTexto}
                onChange={(e) => onEditingTextoChange(e.target.value)}
              />
              <div className="d-flex gap-2">
                <button className="btn btn-sm text-white px-3" style={{ backgroundColor: '#e91e63' }} onClick={() => onSaveEdit(n.id)}>Guardar</button>
                <button className="btn btn-sm btn-outline-secondary px-3" onClick={onCancelEdit}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex gap-2">
                <i className="bi bi-person-circle fs-5 text-secondary" />
                <div>
                  <p className="mb-1 text-dark small">{n.contenido}</p>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Nota #{notas.length - idx} • {n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleString() : ''}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 ms-auto">
                {isEditAllowed(n.fechaCreacion) && (
                  <i
                    className="bi bi-pencil text-secondary cursor-pointer"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => onStartEdit(n)}
                  />
                )}
                {confirmDeleteNotaId === n.id ? (
                  <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                    <span className="text-danger">¿Seguro?</span>
                    <button className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => onConfirmDelete(n.id)}>Sí</button>
                    <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={onCancelDelete}>No</button>
                  </span>
                ) : (
                  <button className="btn btn-sm text-secondary border-0 p-0" onClick={() => onRequestDelete(n.id)}>
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
