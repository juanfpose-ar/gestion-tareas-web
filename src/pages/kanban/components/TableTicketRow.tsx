import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Ticket } from '../../../types';

const P_BG: Record<string, string> = { ALTA: '#fee2e2', MEDIA: '#fef3c7', BAJA: '#dcfce7', URGENTE: '#fce7f3' };
const P_COLOR: Record<string, string> = { ALTA: '#b91c1c', MEDIA: '#b45309', BAJA: '#15803d', URGENTE: '#9d174d' };

interface RowProps {
  ticket: Ticket;
  versionId: number;
  isSelected: boolean;
  onOpen: () => void;
  onToggle: () => void;
}

export const TableTicketRow: React.FC<RowProps> = ({ ticket: t, versionId, isSelected, onOpen, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: t.id,
    data: { type: 'table-ticket', versionId },
  });

  const asignados = (t.asignadosCard ?? t.asignados?.map(u => ({
    id: u.id, username: u.username, nombreCompleto: u.nombreCompleto, colorAvatar: u.colorAvatar,
  })) ?? []) as { id: number; username: string; nombreCompleto?: string; colorAvatar?: string }[];

  const clTotal = t.checklistTotal ?? 0;
  const clDone = t.checklistCompletados ?? 0;
  const clAllDone = clTotal > 0 && clDone === clTotal;

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: isSelected ? '#f5f3ff' : undefined,
        cursor: 'pointer',
      }}
      onClick={onOpen}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center gap-1">
          <span
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'grab', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1, userSelect: 'none' }}
            title="Arrastrar"
          >
            <i className="bi bi-grip-vertical" />
          </span>
          <input
            type="checkbox"
            className="form-check-input mt-0"
            checked={isSelected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </td>
      <td><span className="badge bg-secondary">#{t.id}</span></td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span className="fw-semibold text-dark">{t.titulo}</span>
      </td>
      <td title="Lista de tareas">
        {clTotal > 0 && (clAllDone ? (
          <span className="d-inline-flex align-items-center gap-1 badge" style={{ backgroundColor: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: 6 }}>
            <i className="bi bi-check-square-fill" />{clDone}/{clTotal}
          </span>
        ) : (
          <span className="d-inline-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.78rem' }}>
            <i className="bi bi-check-square" />{clDone}/{clTotal}
          </span>
        ))}
      </td>
      <td title="Prioridad">
        <span className="badge rounded-pill" style={{ backgroundColor: P_BG[t.prioridad] ?? '#e9ecef', color: P_COLOR[t.prioridad] ?? '#475569', fontSize: '0.75rem' }}>
          {t.prioridad}
        </span>
      </td>
      <td title="Estado">
        <span className="badge rounded-pill bg-white border text-secondary" style={{ fontSize: '0.75rem' }}>{t.estadoNombre}</span>
      </td>
      <td title="Usuario asignado">
        {asignados.length === 0 ? (
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>—</span>
        ) : (
          <div className="d-flex align-items-center gap-1">
            {asignados.slice(0, 3).map((u, idx) => (
              <span
                key={u.id}
                title={u.nombreCompleto || u.username}
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{ width: 24, height: 24, fontSize: '0.6rem', backgroundColor: u.colorAvatar || '#6366f1', zIndex: asignados.length - idx, marginLeft: idx > 0 ? -6 : 0, border: '2px solid #fff' }}
              >
                {(u.nombreCompleto || u.username || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            ))}
            {asignados.length > 3 && <span className="text-muted" style={{ fontSize: '0.72rem' }}>+{asignados.length - 3}</span>}
          </div>
        )}
      </td>
    </tr>
  );
};

export const DroppableVersionBody: React.FC<{ versionId: number }> = ({ versionId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `ver-${versionId}`,
    data: { type: 'version-body', versionId },
  });
  return (
    <tr ref={setNodeRef}>
      <td
        colSpan={7}
        className="text-center text-muted py-4 small fst-italic"
        style={{ backgroundColor: isOver ? '#ede9fe' : undefined, transition: 'background 0.15s' }}
      >
        {isOver ? 'Soltar aquí' : 'Sin tickets.'}
      </td>
    </tr>
  );
};
