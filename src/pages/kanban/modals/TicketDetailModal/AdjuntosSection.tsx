import React from 'react';
import { Adjunto } from '../../../../types';

interface Props {
  adjuntos: Adjunto[];
  showForm: boolean;
  onToggleForm: () => void;
  adjuntoTab: 'archivo' | 'enlace';
  onTabChange: (t: 'archivo' | 'enlace') => void;
  adjuntoUrl: string;
  onUrlChange: (v: string) => void;
  adjuntoNombre: string;
  onNombreChange: (v: string) => void;
  onUploadArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddEnlace: (e: React.FormEvent) => void;
  confirmDeleteAdjId: number | null;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  getBadge: (a: Adjunto) => { text: string; bgColor: string };
}

export const AdjuntosSection: React.FC<Props> = ({
  adjuntos, showForm, onToggleForm,
  adjuntoTab, onTabChange,
  adjuntoUrl, onUrlChange, adjuntoNombre, onNombreChange,
  onUploadArchivo, onAddEnlace,
  confirmDeleteAdjId, onRequestDelete, onConfirmDelete, onCancelDelete,
  getBadge,
}) => (
  <div id="sec-adjuntos" className="mb-4">
    <div className="d-flex align-items-center justify-content-between mb-2">
      <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
        <i className="bi bi-paperclip me-1" /> ADJUNTOS
      </div>
      <button className="btn btn-sm btn-outline-secondary px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }} onClick={onToggleForm}>
        Añadir
      </button>
    </div>

    {showForm && (
      <div className="p-3 bg-light rounded-3 border mb-3">
        <div className="d-flex gap-2 mb-3">
          {(['archivo', 'enlace'] as const).map((t) => (
            <button
              key={t}
              className={`btn btn-sm px-3 ${adjuntoTab === t ? 'text-white' : 'btn-outline-secondary'}`}
              style={{ backgroundColor: adjuntoTab === t ? '#e91e63' : 'transparent', fontWeight: 600 }}
              onClick={() => onTabChange(t)}
            >
              <i className={`bi ${t === 'archivo' ? 'bi-file-earmark' : 'bi-link-45deg'} me-1`} />
              {t === 'archivo' ? 'Archivo' : 'Enlace'}
            </button>
          ))}
        </div>

        {adjuntoTab === 'archivo' ? (
          <div>
            <input type="file" className="form-control form-control-sm mb-2" onChange={onUploadArchivo} />
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Máximo 3 MB.</span>
          </div>
        ) : (
          <form onSubmit={onAddEnlace}>
            <div className="mb-2">
              <label className="fw-bold text-dark mb-1" style={{ fontSize: '0.75rem' }}>URL *</label>
              <input type="url" className="form-control form-control-sm border-0 border-bottom rounded-0" placeholder="https://..." required value={adjuntoUrl} onChange={(e) => onUrlChange(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="fw-bold text-dark mb-1" style={{ fontSize: '0.75rem' }}>Texto descriptivo (opcional)</label>
              <input type="text" className="form-control form-control-sm border-0 border-bottom rounded-0" placeholder="..." value={adjuntoNombre} onChange={(e) => onNombreChange(e.target.value)} />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-sm text-white px-3" style={{ backgroundColor: '#e91e63', fontWeight: 600 }}>Insertar</button>
              <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onToggleForm}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    )}

    <div className="d-flex flex-column gap-2">
      {adjuntos.map((a) => {
        const badge = getBadge(a);
        return (
          <div key={a.id} className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <span className="badge px-2 py-1" style={{ backgroundColor: badge.bgColor, fontSize: '0.75rem' }}>{badge.text}</span>
              <div>
                <div className="fw-semibold text-dark small">{a.nombreArchivo}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Añadido {a.fechaCreacion ? new Date(a.fechaCreacion).toLocaleString() : ''}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="text-secondary"><i className="bi bi-box-arrow-up-right" /></a>}
              {confirmDeleteAdjId === a.id ? (
                <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-danger">¿Seguro?</span>
                  <button className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => onConfirmDelete(a.id)}>Sí</button>
                  <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={onCancelDelete}>No</button>
                </span>
              ) : (
                <button className="btn btn-sm text-secondary border-0 p-1" onClick={() => onRequestDelete(a.id)}>
                  <i className="bi bi-trash" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
