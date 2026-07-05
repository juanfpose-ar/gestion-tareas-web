import React, { useMemo, useRef } from 'react';
import { Version, Ticket, Reunion } from '../../../types';
import { ticketService } from '../../../services/ticketService';
import { versionService } from '../../../services/versionService';
import { reunionService } from '../../../services/reunionService';
import toast from 'react-hot-toast';

interface Props {
  versions: Version[];
  tickets: Ticket[];
  filteredTickets: Ticket[];
  reuniones: Reunion[];
  activeBoardId: number | null;
  loadBoardData: (boardId: number) => Promise<void>;
  openModal: (type: any, data?: any) => void;
  reloadReuniones: () => void;
  setVersionModalReadOnly: (val: boolean) => void;
  setEditingVersion: (ver: Version | undefined) => void;
  setVersionModalOpen: (val: boolean) => void;
  setEditingReunion: (r: Reunion | undefined) => void;
  setReunionInitialDate: (d: Date | undefined) => void;
  setReunionModalOpen: (val: boolean) => void;
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
}

export const BoardCalendar: React.FC<Props> = ({
  versions,
  tickets,
  filteredTickets,
  reuniones,
  activeBoardId,
  loadBoardData,
  openModal,
  reloadReuniones,
  setVersionModalReadOnly,
  setEditingVersion,
  setVersionModalOpen,
  setEditingReunion,
  setReunionInitialDate,
  setReunionModalOpen,
  calendarDate,
  setCalendarDate,
}) => {
  const draggedTicketId = useRef<number | null>(null);
  const draggedVersionId = useRef<number | null>(null);
  const draggedReunionId = useRef<number | null>(null);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [calendarDate]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getTicketsForDay = (date: Date) => {
    return filteredTickets.filter((t) => {
      if (!t.fechaVencimiento) return false;
      const tDate = new Date(t.fechaVencimiento);
      return (
        tDate.getDate() === date.getDate() &&
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getReunionesForDay = (date: Date): Reunion[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return reuniones.filter((r) => r.fecha === dateStr);
  };

  const getVersionsForDay = (date: Date): Version[] => {
    return versions.filter((v) => {
      if (!v.fechaVencimiento) return false;
      const d = new Date(v.fechaVencimiento);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDropTicket = async (date: Date, ticketId: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00`;
    if (ticket.fechaVencimiento) {
      const cur = new Date(ticket.fechaVencimiento);
      if (cur.getDate() === date.getDate() && cur.getMonth() === date.getMonth() && cur.getFullYear() === date.getFullYear()) return;
    }
    try {
      await ticketService.actualizarTicket(ticket.id, {
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        prioridad: ticket.prioridad,
        tableroId: ticket.tableroId,
        estadoId: ticket.estadoId,
        etiquetasIds: ticket.etiquetas?.map((e) => e.id) ?? [],
        fechaVencimiento: newDate,
      });
      if (activeBoardId) loadBoardData(activeBoardId);
      toast.success('Fecha de vencimiento actualizada');
    } catch {
      toast.error('Error al mover el ticket');
    }
  };

  const handleDropVersion = async (date: Date, versionId: number) => {
    const ver = versions.find((v) => v.id === versionId);
    if (!ver) return;
    const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (ver.fechaVencimiento) {
      const cur = new Date(ver.fechaVencimiento);
      if (cur.getDate() === date.getDate() && cur.getMonth() === date.getMonth() && cur.getFullYear() === date.getFullYear()) return;
    }
    try {
      await versionService.actualizarVersion(ver.id, {
        titulo: ver.titulo,
        fechaVencimiento: newDate,
        tableroId: ver.tableroId,
        ticketIds: ver.ticketIds || [],
        estado: ver.estado,
      });
      if (activeBoardId) loadBoardData(activeBoardId);
      toast.success(`Fecha de la versión "${ver.titulo}" actualizada`);
    } catch {
      toast.error('Error al mover la versión');
    }
  };

  const handleDropReunion = async (date: Date, reunionId: number) => {
    const reunion = reuniones.find((r) => r.id === reunionId);
    if (!reunion) return;
    const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (reunion.fecha === newDate) return;
    try {
      await reunionService.actualizar(reunion.id, {
        titulo: reunion.titulo,
        descripcion: reunion.descripcion,
        fecha: newDate,
        horaInicio: reunion.horaInicio,
        horaFin: reunion.horaFin,
        color: reunion.color,
        recordatorioMinutos: reunion.recordatorioMinutos,
        tableroId: reunion.tableroId,
        ticketIds: reunion.ticketIds || [],
      });
      reloadReuniones();
      toast.success(`Reunión "${reunion.titulo}" reprogramada`);
    } catch {
      toast.error('Error al mover la reunión');
    }
  };

  return (
    <div className="card shadow-sm border p-4 backdrop-blur rounded-4" style={{ backgroundColor: 'var(--cpq-calendar-bg)' }}>
      <div className="d-flex align-items-center justify-content-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={handlePrevMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="fw-bold text-dark text-capitalize px-2" style={{ minWidth: '140px', textAlign: 'center', fontSize: '1rem' }}>
            {calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleNextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="cpq-calendar-grid">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
          <div key={d} className="text-center fw-bold py-2 bg-light text-muted border-bottom" style={{ fontSize: '0.8rem' }}>
            {d}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-bottom border-end"
                style={{ minHeight: '110px', backgroundColor: 'var(--cpq-calendar-cell-empty-bg)' }}
              />
            );
          }

          const dayTickets = getTicketsForDay(day);
          const dayReuniones = getReunionesForDay(day);
          const dayVersions = getVersionsForDay(day);
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div
              key={day.toISOString()}
              className="p-2 border-bottom border-end d-flex flex-column gap-1"
              style={{
                minHeight: '110px',
                backgroundColor: isToday ? 'var(--cpq-calendar-today-bg)' : 'var(--cpq-calendar-cell-bg)',
                transition: 'background 0.15s'
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#dbeafe'; }}
              onDragLeave={(e) => { e.currentTarget.style.backgroundColor = isToday ? 'var(--cpq-calendar-today-bg)' : 'var(--cpq-calendar-cell-bg)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = isToday ? 'var(--cpq-calendar-today-bg)' : 'var(--cpq-calendar-cell-bg)';
                if (draggedTicketId.current) handleDropTicket(day, draggedTicketId.current);
                if (draggedVersionId.current) handleDropVersion(day, draggedVersionId.current);
                if (draggedReunionId.current) handleDropReunion(day, draggedReunionId.current);
                draggedTicketId.current = null;
                draggedVersionId.current = null;
                draggedReunionId.current = null;
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className={`fw-bold ${isToday ? 'text-primary' : 'text-secondary'}`} style={{ fontSize: '0.85rem' }}>
                  {day.getDate()}
                </span>
                <div className="d-flex align-items-center gap-1">
                  {isToday && <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Hoy</span>}
                  <button
                    className="btn p-0 text-muted"
                    style={{ fontSize: '0.75rem', lineHeight: 1, opacity: 0.55, border: 'none', background: 'none' }}
                    onClick={() => { setEditingReunion(undefined); setReunionInitialDate(day); setReunionModalOpen(true); }}
                    title="Nueva reunión"
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>
              </div>

              <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '100px' }}>
                {dayVersions.map((v) => (
                  <div
                    key={`v-${v.id}`}
                    draggable
                    onDragStart={() => { draggedVersionId.current = v.id; }}
                    onDragEnd={() => { draggedVersionId.current = null; }}
                    className="p-1 rounded text-white text-truncate"
                    style={{ fontSize: '0.7rem', fontWeight: 700, cursor: 'grab', backgroundColor: '#7c3aed' }}
                    onClick={() => {
                      setEditingVersion(v);
                      setVersionModalReadOnly(true);
                      setVersionModalOpen(true);
                    }}
                    title={`Versión: ${v.titulo}`}
                  >
                    <i className="bi bi-tag-fill me-1" style={{ fontSize: '0.62rem' }} />
                    <span>{v.titulo}</span>
                  </div>
                ))}
                {dayTickets.map((t) => {
                  const versionTitle = t.versionId ? versions.find((v) => v.id === t.versionId)?.titulo : undefined;
                  return (
                    <div
                      key={t.id}
                      draggable
                      className="p-1 rounded text-white text-truncate"
                      style={{ fontSize: '0.7rem', fontWeight: 600, cursor: 'grab', backgroundColor: '#3b82f6' }}
                      onClick={() => openModal('ticketDetail', { ticket: t })}
                      onDragStart={() => { draggedTicketId.current = t.id; }}
                      onDragEnd={() => { draggedTicketId.current = null; }}
                      title={t.titulo}
                    >
                      <div>#{t.id} {t.titulo}</div>
                      {versionTitle && (
                        <div
                          className="d-inline-flex align-items-center gap-1 mt-1"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#8b5cf6',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '12px',
                            lineHeight: 1
                          }}
                        >
                          <i className="bi bi-tag-fill" style={{ fontSize: '0.62rem' }} />
                          <span>{versionTitle}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {dayReuniones.map((r) => (
                  <div
                    key={`r-${r.id}`}
                    draggable
                    onDragStart={() => { draggedReunionId.current = r.id; }}
                    onDragEnd={() => { draggedReunionId.current = null; }}
                    className="p-1 rounded text-white text-truncate"
                    style={{ fontSize: '0.7rem', fontWeight: 600, cursor: 'grab', backgroundColor: r.color ?? '#10b981' }}
                    onClick={() => { setEditingReunion(r); setReunionInitialDate(undefined); setReunionModalOpen(true); }}
                    title={r.titulo}
                  >
                    <div><i className="bi bi-calendar-event" style={{ marginRight: 3, fontSize: '0.62rem' }} />{r.titulo}</div>
                    {(r.horaInicio || r.horaFin) && (
                      <div style={{ fontSize: '0.62rem', opacity: 0.9, fontWeight: 500 }}>
                        {r.horaInicio}{r.horaFin ? ` → ${r.horaFin}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
