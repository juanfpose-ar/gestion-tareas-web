import React from 'react';
import { Ticket } from '../../../types';

interface Props {
  show: boolean;
  onClose: () => void;
  tickets: Ticket[];
  loading: boolean;
  onOpenTicket: (ticket: Ticket) => void;
}

export const ArchivedTicketsPanel: React.FC<Props> = ({
  show,
  onClose,
  tickets,
  loading,
  onOpenTicket,
}) => {
  if (!show) return null;

  return (
    <div className="cpq-archived-panel d-flex flex-column shadow-sm cpq-archived-tickets-panel">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i className="bi bi-archive text-warning"></i>
          Tickets Archivados ({tickets.length})
        </h5>
        <button
          className="btn btn-sm btn-link text-secondary p-0 border-0 bg-transparent"
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-6"></i>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-muted small fst-italic mb-0 text-center py-4">No hay tickets archivados.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {tickets.map((t) => {
            const P_BG: Record<string, string> = { ALTA: '#fee2e2', MEDIA: '#fef3c7', BAJA: '#dcfce7', URGENTE: '#fce7f3' };
            const P_COLOR: Record<string, string> = { ALTA: '#b91c1c', MEDIA: '#b45309', BAJA: '#15803d', URGENTE: '#9d174d' };
            return (
              <div
                key={t.id}
                className="archived-ticket-item d-flex align-items-center justify-content-between p-2 rounded-2 border bg-light"
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenTicket(t)}
              >
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-secondary" style={{ fontSize: '0.75rem', minWidth: 32 }}>#{t.id}</span>
                  <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.87rem', maxWidth: '140px' }} title={t.titulo}>{t.titulo}</span>
                  <span className="badge rounded-pill" style={{ fontSize: '0.7rem', backgroundColor: P_BG[t.prioridad] ?? '#e9ecef', color: P_COLOR[t.prioridad] ?? '#475569' }}>
                    {t.prioridad}
                  </span>
                  {t.estadoNombre && (
                    <span className="badge rounded-pill bg-white border text-secondary" style={{ fontSize: '0.7rem' }}>{t.estadoNombre}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
