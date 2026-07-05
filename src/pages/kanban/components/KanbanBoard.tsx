import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { EstadoTablero, Ticket } from '../../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useBoardStore } from '../../../stores/boardStore';

interface KanbanBoardProps {
  estados: EstadoTablero[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onAddTicket: (estadoId: number, titulo?: string) => void;
  onDeleteColumn?: (estadoId: number, nombre?: string) => void;
  onEditColumn?: (estadoId: number, nombre: string, colorHex: string) => void;
  onAddColumn?: (nombre: string, colorHex: string) => void;
  onArchiveTicket?: (ticketId: number) => void;
}

const COL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#64748b',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  estados,
  tickets,
  onSelectTicket,
  onAddTicket,
  onDeleteColumn,
  onEditColumn,
  onAddColumn,
  onArchiveTicket,
}) => {
  const { updateTicketEstado, reorderEstados, reorderTicketsInEstado } = useBoardStore();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeColumn, setActiveColumn] = useState<EstadoTablero | null>(null);
  const originalEstadoIdRef = useRef<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addName, setAddName] = useState('');
  const [addColor, setAddColor] = useState('');
  const addPanelRef = useRef<HTMLDivElement>(null);
  const addNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showAddPanel) return;
    if (addNameInputRef.current) addNameInputRef.current.focus();
    const handler = (e: MouseEvent) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target as Node))
        setShowAddPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddPanel]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const sortedEstados = [...estados].sort((a, b) => a.orden - b.orden);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'column') {
      const colIdStr = active.id.toString();
      const estadoId = Number(colIdStr.replace('col-', ''));
      const col = estados.find((e) => e.id === estadoId);
      if (col) setActiveColumn(col);
    } else if (type === 'ticket') {
      const ticket = tickets.find((t) => t.id === active.id);
      if (ticket) {
        setActiveTicket(ticket);
        originalEstadoIdRef.current = ticket.estadoId;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'ticket') return;

    const ticketId = active.id as number;
    const targetEstadoId = over.data.current?.estadoId as number | undefined;

    if (!targetEstadoId) return;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.estadoId !== targetEstadoId) {
      updateTicketEstado(ticketId, targetEstadoId).catch(() => null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);
    setActiveColumn(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      const activeColId = Number(active.id.toString().replace('col-', ''));
      const overColIdStr = over.id.toString();
      const overColId = Number(overColIdStr.startsWith('col-') ? overColIdStr.replace('col-', '') : over.data.current?.estadoId);

      if (activeColId && overColId && activeColId !== overColId) {
        const oldIndex = sortedEstados.findIndex((e) => e.id === activeColId);
        const newIndex = sortedEstados.findIndex((e) => e.id === overColId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(sortedEstados, oldIndex, newIndex);
          reorderEstados(reordered).catch(() => null);
        }
      }
    } else if (activeType === 'ticket') {
      const ticketId = active.id as number;
      const targetEstadoId = over.data.current?.estadoId as number | undefined;
      const origEstadoId = originalEstadoIdRef.current;
      originalEstadoIdRef.current = null;

      if (!targetEstadoId) return;

      if (origEstadoId === targetEstadoId && over.data.current?.type === 'ticket' && over.id !== ticketId) {
        // Same-column reorder
        const colTickets = [...tickets]
          .filter((t) => t.estadoId === targetEstadoId)
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);
        const oldIndex = colTickets.findIndex((t) => t.id === ticketId);
        const newIndex = colTickets.findIndex((t) => t.id === (over.id as number));
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(colTickets, oldIndex, newIndex);
          reorderTicketsInEstado(targetEstadoId, reordered.map((t) => t.id)).catch(() => null);
        }
      } else if (origEstadoId !== targetEstadoId) {
        // Cross-column: handleDragOver already updated optimistically; confirm on end
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket && ticket.estadoId !== targetEstadoId) {
          updateTicketEstado(ticketId, targetEstadoId).catch(() => null);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="kanban-board"
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          padding: '4px 2px 16px',
          overflowX: 'auto',
          minHeight: 'calc(100vh - 140px)',
        }}
      >
        <SortableContext items={sortedEstados.map((e) => `col-${e.id}`)} strategy={horizontalListSortingStrategy}>
          {sortedEstados.map((estado) => {
            const columnTickets = tickets
            .filter((t) => t.estadoId === estado.id)
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);
            return (
              <KanbanColumn
                key={estado.id}
                estado={estado}
                tickets={columnTickets}
                onSelectTicket={onSelectTicket}
                onAddTicket={onAddTicket}
                onDeleteColumn={onDeleteColumn}
                onEditColumn={onEditColumn}
                onArchiveTicket={onArchiveTicket}
              />
            );
          })}
        </SortableContext>

        {onAddColumn && (
          <div ref={addPanelRef} style={{ flexShrink: 0 }}>
            {showAddPanel ? (
              <div
                style={{
                  width: 232,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.13)',
                  padding: '14px',
                }}
              >
                <div className="mb-2">
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nombre
                  </label>
                  <input
                    ref={addNameInputRef}
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Ej: En revisión…"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && addName.trim()) {
                        onAddColumn(addName.trim(), addColor);
                        setAddName(''); setAddColor(''); setShowAddPanel(false);
                      }
                      if (e.key === 'Escape') setShowAddPanel(false);
                    }}
                    style={{ fontWeight: 600, fontSize: '0.85rem' }}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Color
                  </label>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    <div
                      onClick={() => setAddColor('')}
                      title="Sin color"
                      style={{
                        width: 24, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                        border: addColor === '' ? '2px solid #1e293b' : '2px solid #e2e8f0',
                        background: 'repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 3px,#fff 3px,#fff 6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {addColor === '' && <i className="bi bi-check" style={{ fontSize: '0.7rem', color: '#1e293b' }} />}
                    </div>
                    {COL_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => setAddColor(c)}
                        style={{
                          width: 24, height: 24, borderRadius: 4, backgroundColor: c,
                          cursor: 'pointer', flexShrink: 0,
                          border: addColor === c ? '2px solid #1e293b' : '2px solid transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {addColor === c && <i className="bi bi-check" style={{ fontSize: '0.7rem', color: '#fff' }} />}
                      </div>
                    ))}
                    <input
                      type="color"
                      value={addColor || '#3b82f6'}
                      onChange={(e) => setAddColor(e.target.value)}
                      style={{ width: 24, height: 24, padding: 1, border: '2px solid #e2e8f0', cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                      title="Color personalizado"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm flex-grow-1"
                    style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    disabled={!addName.trim()}
                    onClick={() => {
                      onAddColumn(addName.trim(), addColor);
                      setAddName(''); setAddColor(''); setShowAddPanel(false);
                    }}
                  >
                    Añadir
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowAddPanel(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-sm d-flex align-items-center gap-2 border"
                style={{
                  width: 232,
                  borderRadius: 14,
                  padding: '12px 16px',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255,255,255,0.42)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: '#1e293b',
                  fontWeight: 600,
                  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.1)',
                }}
                onClick={() => { setAddName(''); setAddColor(''); setShowAddPanel(true); }}
              >
                <i className="bi bi-plus-lg fs-6" />
                <span>Añadir otra lista</span>
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTicket && (
          <div style={{ opacity: 0.9, transform: 'rotate(2deg)', width: 256 }}>
            <KanbanCard ticket={activeTicket} onClick={() => null} />
          </div>
        )}
        {activeColumn && (
          <div style={{ opacity: 0.8, transform: 'rotate(1deg)' }}>
            <KanbanColumn
              estado={activeColumn}
              tickets={tickets.filter((t) => t.estadoId === activeColumn.id)}
              onSelectTicket={() => null}
              onAddTicket={() => null}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
