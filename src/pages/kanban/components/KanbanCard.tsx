import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ticket, ChecklistItem } from '../../../types';
import { getContrastColor } from '../../../utils/colorUtils';
import { checklistService } from '../../../services/itemServices';
import { ticketService } from '../../../services/ticketService';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';


interface KanbanCardProps {
  ticket: Ticket;
  onClick: () => void;
  onArchive?: () => void;
}

const getPriorityColor = (p?: string) => {
  switch (p) {
    case 'URGENTE': return '#dc2626';
    case 'ALTA':    return '#ef4444';
    case 'MEDIA':   return '#f59e0b';
    case 'BAJA':    return '#10b981';
    default:        return '#3b82f6';
  }
};

const formatDueDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

const isDueSoonOrOverdue = (dateStr?: string) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = dZero.getTime() - nowZero.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  } catch {
    return false;
  }
};

const getInitials = (nombreCompleto?: string, username?: string) => {
  const name = nombreCompleto || username || '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

export const KanbanCard = React.memo(function KanbanCard({ ticket, onClick, onArchive }: KanbanCardProps) {
  // 3-dot menu
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const localUpdateRef = useRef(false);

  const [clOpen, setClOpen] = useState(false);
  const [clItems, setClItems] = useState<ChecklistItem[]>([]);
  const [clLoading, setClLoading] = useState(false);
  const [clFetched, setClFetched] = useState(false);

  useEffect(() => {
    if (!clOpen) return;

    if (localUpdateRef.current) {
      localUpdateRef.current = false;
      return;
    }

    let active = true;
    setClLoading(true);
    checklistService.getByTicket(ticket.id)
      .then((items) => {
        if (active) {
          setClItems(items);
          setClFetched(true);
        }
      })
      .catch((err) => {
        console.error('Error fetching checklist', err);
      })
      .finally(() => {
        if (active) {
          setClLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [ticket, clOpen]);


  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsideBtn = !menuRef.current || !menuRef.current.contains(target);
      const outsideDrop = !dropdownRef.current || !dropdownRef.current.contains(target);
      if (outsideBtn && outsideDrop) {
        setMenuOpen(false);
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      setMenuPos(null);
      return;
    }
    const rect = menuRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 2, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: 'ticket', ticket, estadoId: ticket.estadoId },
  });

  const checklistTotal = ticket.checklistTotal ?? ticket.checklist?.length ?? 0;
  const checklistDone  = ticket.checklistCompletados ?? ticket.checklist?.filter((i) => i.completado).length ?? 0;

  // When panel is open, derive counts from local items (so toggles reflect immediately)
  const displayDone  = clOpen && clFetched ? clItems.filter((i) => i.completado).length : checklistDone;
  const displayTotal = clOpen && clFetched ? clItems.length : checklistTotal;
  const allDone      = displayTotal > 0 && displayDone === displayTotal;

  const countAdjuntos     = ticket.cantidadAdjuntos ?? ticket.adjuntos?.length ?? 0;
  const countVinculos     = ticket.cantidadVinculos ?? 0;
  const countNotas        = ticket.cantidadNotas ?? ticket.notas?.length ?? 0;
  const countRecordatorios = ticket.cantidadRecordatorios ?? 0;

  const asignados = ticket.asignadosCard ?? ticket.asignados?.map((u) => ({
    id: u.id, username: u.username, nombreCompleto: u.nombreCompleto, colorAvatar: u.colorAvatar,
  })) ?? [];

  const priorityColor = getPriorityColor(ticket.prioridad);
  const versions = useBoardStore((s) => s.versions);
  const versionTitle = ticket.versionId
    ? versions.find((v) => v.id === ticket.versionId)?.titulo
    : undefined;

  const handleOpenChecklist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClOpen(!clOpen);
  };

  const handleCardCompletadoToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !ticket.completado;
    useBoardStore.getState().updateTicketLocal(ticket.id, { completado: nextVal });
    try {
      await ticketService.cambiarCompletado(ticket.id, nextVal);
    } catch {
      toast.error('Error al cambiar el estado de completado');
      useBoardStore.getState().updateTicketLocal(ticket.id, { completado: ticket.completado });
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    const toggled = !item.completado;
    localUpdateRef.current = true;
    setClItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completado: toggled } : i));

    const diff = toggled ? 1 : -1;
    const newCompletados = Math.max(0, Math.min(displayTotal, displayDone + diff));
    useBoardStore.getState().updateTicketLocal(ticket.id, {
      checklistCompletados: newCompletados,
    });

    try {
      await checklistService.toggleCompletado(ticket.id, item.id);
    } catch {
      localUpdateRef.current = true;
      setClItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completado: item.completado } : i));
      useBoardStore.getState().updateTicketLocal(ticket.id, {
        checklistCompletados: displayDone,
      });
    }
  };


  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    backgroundColor: ticket.archivado ? '#fefce8' : '#ffffff',
    borderRadius: '10px',
    padding: '10px 12px',
    paddingRight: '32px',
    boxShadow: isDragging
      ? '0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)'
      : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    cursor: isDragging ? 'grabbing' : 'pointer',
    userSelect: 'none',
    marginBottom: '8px',
    border: ticket.archivado ? '1px solid #fde68a' : '1px solid rgba(0,0,0,0.08)',
    borderLeft: `5px solid ${ticket.archivado ? '#f59e0b' : priorityColor}`,
    touchAction: 'none',
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); setClOpen(false); onClick(); }}
      className="cpq-card mb-2"
    >
      {/* 1. Etiquetas */}
      {ticket.etiquetas && ticket.etiquetas.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {ticket.etiquetas.map((etiqueta) => (
            <span
              key={etiqueta.id}
              className="badge"
              style={{
                backgroundColor: etiqueta.colorHex ?? '#3b82f6',
                color: getContrastColor(etiqueta.colorHex ?? '#3b82f6'),
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {etiqueta.nombre}
            </span>
          ))}
        </div>
      )}

      {/* 2. Título */}
      <div className="d-flex align-items-start gap-2 mb-2">
        <i
          className={`bi ${ticket.completado ? 'bi-check-circle-fill' : 'bi-circle'} cursor-pointer`}
          style={{
            fontSize: '1.1rem',
            color: ticket.completado ? '#68a623' : '#a1a1aa',
            marginTop: '1px',
            flexShrink: 0
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleCardCompletadoToggle}
        />
        <div style={{
          fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.35,
          color: ticket.completado ? 'var(--cpq-text-muted)' : '#1e293b',
          textDecoration: ticket.completado ? 'line-through' : 'none',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}>
          {ticket.titulo}
        </div>
      </div>

      {/* Botón 3 puntos — esquina superior derecha */}
      <div ref={menuRef} style={{ position: 'absolute', top: 6, right: 6 }}>
        <button
          type="button"
          onClick={handleMenuToggle}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', padding: '2px 5px', lineHeight: 1,
            color: '#94a3b8', cursor: 'pointer', borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
          title="Opciones"
        >
          <i className="bi bi-three-dots" style={{ fontSize: '0.95rem' }} />
        </button>
      </div>

      {menuOpen && menuPos && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="dropdown-menu show shadow"
          style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 99999,
            minWidth: 140, borderRadius: 8, padding: '4px 0',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <button
            className="dropdown-item d-flex align-items-center gap-2"
            style={{ fontSize: '0.85rem' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMenuPos(null); setClOpen(false); onClick(); }}
          >
            <i className="bi bi-arrow-up-right-square text-primary" />
            Abrir
          </button>
          {!ticket.archivado && (
            <button
              className="dropdown-item d-flex align-items-center gap-2"
              style={{ fontSize: '0.85rem' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMenuPos(null); onArchive?.(); }}
            >
              <i className="bi bi-archive text-secondary" />
              Archivar
            </button>
          )}
        </div>,
        document.body
      )}

      {/* 3. Fila de indicadores */}
      <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '0.78rem', color: '#64748b' }}>

        {ticket.fechaVencimiento && (
          isDueSoonOrOverdue(ticket.fechaVencimiento) ? (
            <span
              className="badge d-inline-flex align-items-center gap-1"
              style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: '0.72rem', fontWeight: 600, padding: '3px 7px', borderRadius: '6px' }}
              title="Vence pronto o vencido"
            >
              <i className="bi bi-clock" />
              {formatDueDate(ticket.fechaVencimiento)}
            </span>
          ) : (
            <span className="d-inline-flex align-items-center gap-1 text-secondary" title="Fecha de vencimiento">
              <i className="bi bi-clock" />
              {formatDueDate(ticket.fechaVencimiento)}
            </span>
          )
        )}

        {countRecordatorios > 0 && (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" title="Recordatorios">
            <i className="bi bi-bell" />{countRecordatorios}
          </span>
        )}

        {ticket.descripcion && (
          <span className="text-secondary" title="Tiene descripción" style={{ fontSize: '0.95rem' }}>
            <i className="bi bi-justify-left" />
          </span>
        )}

        {/* Checklist — clickeable para abrir panel */}
        {checklistTotal > 0 && (
          allDone ? (
            <button
              type="button"
              className="d-inline-flex align-items-center gap-1 border-0 badge"
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 7px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Lista de tareas (Completado)"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleOpenChecklist}
            >
              <i className="bi bi-check-square-fill" />
              {displayDone}/{displayTotal}
            </button>
          ) : (
            <button
              type="button"
              className="d-inline-flex align-items-center gap-1 border-0 text-secondary bg-transparent p-0"
              style={{
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
              title="Lista de tareas (Pendiente)"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleOpenChecklist}
            >
              <i className="bi bi-check-square" />
              {displayDone}/{displayTotal}
            </button>
          )
        )}

        {countAdjuntos > 0 && (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" title="Adjuntos">
            <i className="bi bi-paperclip" />{countAdjuntos}
          </span>
        )}

        {countVinculos > 0 && (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" title="Tickets vinculados">
            <i className="bi bi-link-45deg" />{countVinculos}
          </span>
        )}

        {countNotas > 0 && (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" title="Notas">
            <i className="bi bi-chat-left-text" />{countNotas}
          </span>
        )}

        {(ticket.cantidadInformados ?? 0) > 0 && (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" title={`${ticket.cantidadInformados} informado${(ticket.cantidadInformados ?? 0) > 1 ? 'es' : ''}`}>
            <i className="bi bi-eye" style={{ fontSize: '0.85rem' }} />
          </span>
        )}

        {versionTitle && (
          <span
            className="badge d-inline-flex align-items-center gap-1 ms-auto"
            style={{ backgroundColor: '#7c3aed', color: '#fff', fontSize: '0.72rem', fontWeight: 600, padding: '3px 7px', borderRadius: '6px' }}
            title={`Versión: ${versionTitle}`}
          >
            <i className="bi bi-tag-fill" style={{ fontSize: '0.65rem' }} />
            {versionTitle}
          </span>
        )}

        {asignados.length > 0 && (
          <div className={`d-inline-flex align-items-center ${versionTitle ? '' : 'ms-auto'}`} style={{ gap: '-4px' }}>
            {asignados.slice(0, 3).map((u, idx) => (
              <span
                key={u.id}
                title={u.nombreCompleto || u.username}
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{
                  width: 22, height: 22, fontSize: '0.6rem',
                  backgroundColor: u.colorAvatar ?? '#6366f1',
                  color: (() => { const c = u.colorAvatar ?? '#6366f1'; const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16); return (0.299*r+0.587*g+0.114*b)/255 > 0.55 ? '#212529' : '#ffffff'; })(),
                  border: '2px solid #fff',
                  marginLeft: idx > 0 ? -6 : 0,
                  zIndex: asignados.length - idx,
                  position: 'relative',
                }}
              >
                {getInitials(u.nombreCompleto, u.username)}
              </span>
            ))}
            {asignados.length > 3 && (
              <span
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ width: 22, height: 22, fontSize: '0.6rem', backgroundColor: '#94a3b8', border: '2px solid #fff', marginLeft: -6, position: 'relative' }}
              >
                +{asignados.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Panel de checklist expandible */}
      {clOpen && (
        <div
          style={{
            marginTop: 8,
            borderTop: '1px solid #f1f5f9',
            paddingTop: 8,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {clLoading ? (
            <div className="d-flex justify-content-center py-2">
              <span className="spinner-border spinner-border-sm text-primary" />
            </div>
          ) : clItems.length === 0 ? (
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>Sin tareas.</p>
          ) : (
            <div className="d-flex flex-column gap-1">
              {clItems.map((item) => (
                <label
                  key={item.id}
                  className="d-flex align-items-start gap-2"
                  style={{ cursor: 'pointer', margin: 0 }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0 flex-shrink-0"
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                    checked={item.completado}
                    onChange={() => handleToggle(item)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span style={{
                    fontSize: '0.78rem',
                    lineHeight: 1.35,
                    color: item.completado ? '#94a3b8' : '#334155',
                    textDecoration: item.completado ? 'line-through' : 'none',
                  }}>
                    {item.texto ?? item.contenido}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
