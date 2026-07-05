import React from 'react';
import { Ticket } from '../../../types';

interface Props {
  filteredTickets: Ticket[];
  openModal: (type: any, data?: any) => void;
}

export const BoardTimeline: React.FC<Props> = ({ filteredTickets, openModal }) => {
  const timelineTickets = filteredTickets
    .filter((t) => t.fechaVencimiento)
    .sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime());

  return (
    <div className="card shadow-sm border p-4 bg-white bg-opacity-75 backdrop-blur rounded-4">
      {timelineTickets.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-clock-history fs-2 mb-2"></i>
          <p className="mb-0">No hay tareas con fecha de vencimiento configurada para mostrar en la cronología.</p>
        </div>
      ) : (
        <div className="position-relative ps-4" style={{
          borderLeft: '2px solid #cbd5e1',
          margin: '10px 0 10px 20px'
        }}>
          {timelineTickets.map((t) => {
            const P_BG: Record<string, string> = { ALTA: '#fee2e2', MEDIA: '#fef3c7', BAJA: '#dcfce7', URGENTE: '#fce7f3' };
            const P_COLOR: Record<string, string> = { ALTA: '#b91c1c', MEDIA: '#b45309', BAJA: '#15803d', URGENTE: '#9d174d' };
            return (
              <div key={t.id} className="position-relative mb-4">
                <div className="position-absolute" style={{
                  left: '-29px',
                  top: '4px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '3px solid #fff',
                  boxShadow: '0 0 0 2px #3b82f6'
                }} />

                <div
                  className="p-3 bg-light rounded-3 border hover-shadow cursor-pointer"
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => openModal('ticketDetail', { ticket: t })}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <span className="text-muted fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-calendar2-event" />
                      {new Date(t.fechaVencimiento!).toLocaleDateString()}
                    </span>
                    <div className="d-flex gap-2">
                      <span className="badge rounded-pill" style={{
                        backgroundColor: P_BG[t.prioridad] ?? '#e9ecef',
                        color: P_COLOR[t.prioridad] ?? '#475569',
                        fontSize: '0.7rem'
                      }}>
                        {t.prioridad}
                      </span>
                      <span className="badge rounded-pill bg-white border text-secondary" style={{ fontSize: '0.7rem' }}>
                        {t.estadoNombre}
                      </span>
                    </div>
                  </div>
                  <h6 className="fw-bold mb-1 text-dark">#{t.id} {t.titulo}</h6>
                  <p className="text-secondary mb-0 small text-truncate" style={{ maxWidth: '600px' }}>
                    {t.descripcion || <span className="fst-italic text-muted">Sin descripción</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
