import React, { useState } from 'react';
import { Ticket, VinculoDTO } from '../../../types';
import { vinculoService } from '../../../services/itemServices';

interface Props {
  ticket: Ticket;
  allTickets: Ticket[];
  vinculos: VinculoDTO[];
  onClose: () => void;
  onUpdate: () => void;
}

const PRIORIDAD_STYLE: Record<string, { bg: string; color: string } | undefined> = {
  ALTA:   { bg: '#fee2e2', color: '#b91c1c' },
  MEDIA:  { bg: '#fef3c7', color: '#b45309' },
  BAJA:   { bg: '#dcfce7', color: '#15803d' },
  URGENTE:{ bg: '#fce7f3', color: '#9d174d' },
};

export const VincularTicketModal: React.FC<Props> = ({ ticket, allTickets, vinculos, onClose, onUpdate }) => {
  const [query, setQuery] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const getLinkedTicketId = (v: VinculoDTO) =>
    v.ticketOrigenId === ticket.id ? v.ticketDestinoId : v.ticketOrigenId;

  const getLinkedTicketTitle = (v: VinculoDTO) =>
    v.ticketOrigenId === ticket.id ? v.ticketDestinoTitulo : v.ticketOrigenTitulo;

  const getVinculoForTicket = (targetId: number) =>
    vinculos.find(
      (v) =>
        (v.ticketOrigenId === ticket.id && v.ticketDestinoId === targetId) ||
        (v.ticketDestinoId === ticket.id && v.ticketOrigenId === targetId)
    );

  const otherTickets = allTickets.filter((t) => t.id !== ticket.id);

  const filteredTickets = otherTickets.filter((t) => {
    const q = query.replace(/^#/, '').toLowerCase().trim();
    if (!q) return true;
    return t.id.toString().includes(q) || t.titulo.toLowerCase().includes(q);
  });

  const handleToggle = async (target: Ticket) => {
    setLoadingId(target.id);
    try {
      const existing = getVinculoForTicket(target.id);
      if (existing) {
        await vinculoService.eliminarVinculo(existing.id);
      } else {
        await vinculoService.crearVinculo(ticket.id, target.id);
      }
      onUpdate();
    } catch (err) {
      console.error('Error al vincular ticket', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteVinculo = async (vinculoId: number) => {
    await vinculoService.eliminarVinculo(vinculoId);
    setConfirmDeleteId(null);
    onUpdate();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 580, margin: '0 1rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3 shadow-lg d-flex flex-column" style={{ maxHeight: '90vh' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-link-45deg fs-4 text-danger" />
              <span className="fw-bold text-dark fs-6">Vincular con otro Ticket</span>
            </div>
            <button className="btn-close shadow-none" onClick={onClose} />
          </div>

          {/* Vinculados actuales */}
          {vinculos.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                Tickets Vinculados ({vinculos.length})
              </div>
              <div className="d-flex flex-column gap-2">
                {vinculos.map((v) => {
                  const linkedId = getLinkedTicketId(v);
                  const linkedTitle = getLinkedTicketTitle(v) ?? `Ticket #${linkedId}`;
                  const linkedTicket = allTickets.find((t) => t.id === linkedId);
                  const pStyle = linkedTicket ? (PRIORIDAD_STYLE[linkedTicket.prioridad] ?? { bg: '#e9ecef', color: '#475569' }) : { bg: '#e9ecef', color: '#475569' };

                  return (
                    <div
                      key={v.id}
                      className="d-flex align-items-center justify-content-between p-2 rounded-2 border"
                      style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary" style={{ fontSize: '0.75rem', minWidth: 36 }}>#{linkedId}</span>
                        <span className="fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>{linkedTitle}</span>
                        {linkedTicket && (
                          <span
                            className="badge rounded-pill"
                            style={{ fontSize: '0.7rem', backgroundColor: pStyle.bg, color: pStyle.color }}
                          >
                            {linkedTicket.prioridad}
                          </span>
                        )}
                      </div>
                      <div>
                        {confirmDeleteId === v.id ? (
                          <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                            <span className="text-danger fw-bold">¿Seguro?</span>
                            <button className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => handleDeleteVinculo(v.id)}>Sí</button>
                            <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmDeleteId(null)}>No</button>
                          </span>
                        ) : (
                          <button className="btn btn-sm text-secondary border-0 p-1" onClick={() => setConfirmDeleteId(v.id)} title="Eliminar vínculo">
                            <i className="bi bi-x-lg" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                className="form-control ps-5"
                placeholder="Buscar por #ID o título..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="px-4 pb-3 overflow-auto flex-grow-1" style={{ maxHeight: 420 }}>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-search fs-3 d-block mb-2 opacity-25" />
                No se encontraron tickets.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isVinculado = !!getVinculoForTicket(t.id);
                const pStyle = PRIORIDAD_STYLE[t.prioridad] ?? { bg: '#e9ecef', color: '#475569' };

                return (
                  <div
                    key={t.id}
                    className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 border"
                    style={{
                      backgroundColor: isVinculado ? '#eff6ff' : '#ffffff',
                      borderColor: isVinculado ? '#bfdbfe' : '#e9ecef',
                      cursor: 'pointer',
                    }}
                    onClick={() => !loadingId && handleToggle(t)}
                  >
                    {/* Left: ticket info */}
                    <div className="d-flex align-items-start gap-3 flex-grow-1 me-3">
                      <span className="badge bg-secondary mt-1 flex-shrink-0" style={{ fontSize: '0.8rem', minWidth: 40 }}>
                        #{t.id}
                      </span>
                      <div className="min-width-0">
                        <div className="fw-semibold text-dark mb-1" style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>
                          {t.titulo}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          {/* Prioridad */}
                          <span
                            className="badge rounded-pill"
                            style={{ fontSize: '0.7rem', backgroundColor: pStyle.bg, color: pStyle.color }}
                          >
                            {t.prioridad}
                          </span>
                          {/* Estado */}
                          {t.estadoNombre && (
                            <span className="badge rounded-pill bg-light border text-secondary" style={{ fontSize: '0.7rem' }}>
                              {t.estadoNombre}
                            </span>
                          )}
                          {/* Fecha vencimiento */}
                          {t.fechaVencimiento && (
                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-calendar2" />
                              {new Date(t.fechaVencimiento).toLocaleDateString()}
                            </span>
                          )}
                          {/* Etiquetas */}
                          {t.etiquetas && t.etiquetas.length > 0 && t.etiquetas.slice(0, 3).map((etq) => (
                            <span
                              key={etq.id}
                              className="badge rounded-pill"
                              style={{ fontSize: '0.65rem', backgroundColor: etq.colorHex || '#3b82f6', color: '#fff' }}
                            >
                              {etq.nombre}
                            </span>
                          ))}
                          {/* Checklist */}
                          {t.checklist && t.checklist.length > 0 && (
                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-check2-square" />
                              {t.checklist.filter((c) => c.completado).length}/{t.checklist.length}
                            </span>
                          )}
                          {/* Adjuntos */}
                          {(t.cantidadAdjuntos ?? 0) > 0 && (
                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-paperclip" />
                              {t.cantidadAdjuntos}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: action */}
                    <div className="flex-shrink-0">
                      {loadingId === t.id ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                      ) : isVinculado ? (
                        <span className="badge px-3 py-2 text-white" style={{ backgroundColor: '#e91e63', fontSize: '0.78rem' }}>
                          <i className="bi bi-check-lg me-1" />Vinculado
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border px-3 py-2" style={{ fontSize: '0.78rem' }}>
                          + Vincular
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
