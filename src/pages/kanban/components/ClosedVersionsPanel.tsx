import React from 'react';
import { Version, Ticket, VersionEstado } from '../../../types';

interface Props {
  show: boolean;
  onClose: () => void;
  versions: Version[];
  tickets: Ticket[];
  onEditVersion: (version: Version) => void;
}

export const ClosedVersionsPanel: React.FC<Props> = ({
  show,
  onClose,
  versions,
  tickets,
  onEditVersion,
}) => {
  if (!show) return null;

  const closedVersions = versions.filter((v) => v.estado === VersionEstado.CERRADO);

  return (
    <div className="d-flex flex-column shadow-sm cpq-closed-versions-panel">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#5b21b6' }}>
          <i className="bi bi-tag-fill" style={{ color: '#7c3aed' }} />
          Versiones cerradas ({closedVersions.length})
        </h5>
        <button
          className="btn btn-sm btn-link text-secondary p-0 border-0 bg-transparent"
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-6" />
        </button>
      </div>
      {closedVersions.length === 0 ? (
        <p className="text-muted small fst-italic mb-0 text-center py-4">No hay versiones cerradas.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {closedVersions.map((ver) => {
            const count = tickets.filter((t) => t.versionId === ver.id).length;
            const dueDateStr = ver.fechaVencimiento
              ? new Date(ver.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            return (
              <div
                key={ver.id}
                className="d-flex flex-column p-3 rounded-3 border"
                style={{ backgroundColor: '#f8f7ff', borderColor: '#ddd6fe' }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-tag-fill" style={{ color: '#a78bfa', fontSize: '0.85rem' }} />
                    <span className="fw-semibold" style={{ color: '#5b21b6', fontSize: '0.9rem' }}>{ver.titulo}</span>
                    <span className="badge rounded-pill" style={{ backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '0.7rem' }}>
                      {count} {count === 1 ? 'tarjeta' : 'tarjetas'}
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => onEditVersion(ver)}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                </div>
                {dueDateStr && (
                  <span className="text-muted mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-calendar2-check" />
                    {dueDateStr}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
