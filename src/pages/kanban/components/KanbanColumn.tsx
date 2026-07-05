import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EstadoTablero, Ticket } from '../../../types';
import { KanbanCard } from './KanbanCard';

const COL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#64748b',
];

interface KanbanColumnProps {
  estado: EstadoTablero;
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onAddTicket: (estadoId: number, titulo?: string) => void;
  onDeleteColumn?: (estadoId: number, nombre?: string) => void;
  onEditColumn?: (estadoId: number, nombre: string, colorHex: string) => void;
  onArchiveTicket?: (ticketId: number) => void;
}

export const KanbanColumn = React.memo(function KanbanColumn({
  estado,
  tickets,
  onSelectTicket,
  onAddTicket,
  onDeleteColumn,
  onEditColumn,
  onArchiveTicket,
}: KanbanColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setColumnNodeRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: `col-${estado.id}`,
    data: { type: 'column', estadoId: estado.id, estado },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: estado.id,
    data: { type: 'column', estadoId: estado.id },
  });

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen && nameInputRef.current) nameInputRef.current.focus();
  }, [dropdownOpen]);

  const openDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(estado.nombre);
    setEditColor(estado.colorHex || '');
    setDropdownOpen(true);
  };

  const save = () => {
    const name = editName.trim();
    if (!name) return;
    setDropdownOpen(false);
    onEditColumn?.(estado.id, name, editColor);
  };

  const handleAdd = () => {
    const title = newTitle.trim();
    if (title) {
      onAddTicket(estado.id, title);
      setNewTitle('');
      setAdding(false);
    }
  };

  const colColor = estado.colorHex || undefined;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: 272,
    flexShrink: 0,
    backgroundColor: isOver
      ? 'rgba(224, 242, 254, 0.65)'
      : isColumnDragging
      ? 'rgba(226, 232, 240, 0.5)'
      : 'rgba(255, 255, 255, 0.42)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    borderRadius: 14,
    padding: '0 8px 8px',
    borderTop: colColor ? `4px solid ${colColor}` : '4px solid transparent',
    borderLeft: '1px solid rgba(255, 255, 255, 0.45)',
    borderRight: '1px solid rgba(255, 255, 255, 0.45)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.45)',
    display: 'flex',
    flexDirection: 'column',
    opacity: isColumnDragging ? 0.4 : 1,
    boxShadow: isColumnDragging
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      : '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
  };

  return (
    <div ref={setColumnNodeRef} style={style}>
      {/* Encabezado */}
      <div
        {...attributes}
        {...listeners}
        className="d-flex align-items-center justify-content-between py-2 px-2 mb-1"
        style={{ userSelect: 'none', cursor: 'grab' }}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-grip-vertical text-muted" style={{ fontSize: '0.9rem' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
            {estado.nombre}
          </span>
        </div>

        <div className="d-flex align-items-center gap-1">
          <span
            className="badge rounded-pill"
            style={{
              backgroundColor: colColor,
              color: '#fff',
              fontSize: '0.72rem',
              minWidth: 22,
              textAlign: 'center',
            }}
          >
            {tickets.length}
          </span>
          {onEditColumn && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-sm text-secondary p-0 ms-1 border-0"
                onClick={openDropdown}
                title="Editar columna"
              >
                <i className="bi bi-pencil" style={{ fontSize: '0.78rem' }} />
              </button>

              {dropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 1000,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '12px',
                    width: 220,
                    marginTop: 4,
                  }}
                >
                  <div className="mb-2">
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Nombre
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      className="form-control form-control-sm mt-1"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save();
                        if (e.key === 'Escape') setDropdownOpen(false);
                      }}
                      style={{ fontSize: '0.85rem', fontWeight: 600 }}
                    />
                  </div>

                  <div className="mb-3">
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Color
                    </label>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {/* Sin color */}
                      <div
                        onClick={() => setEditColor('')}
                        title="Sin color"
                        style={{
                          width: 24, height: 24, borderRadius: 4, cursor: 'pointer',
                          border: editColor === '' ? '2px solid #1e293b' : '2px solid #e2e8f0',
                          background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 3px, #fff 3px, #fff 6px)',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {editColor === '' && (
                          <i className="bi bi-check" style={{ fontSize: '0.7rem', position: 'absolute', top: 1, left: 2, color: '#1e293b' }} />
                        )}
                      </div>
                      {COL_COLORS.map((c) => (
                        <div
                          key={c}
                          onClick={() => setEditColor(c)}
                          style={{
                            width: 24, height: 24, borderRadius: 4,
                            backgroundColor: c, cursor: 'pointer', flexShrink: 0,
                            border: editColor === c ? '2px solid #1e293b' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {editColor === c && <i className="bi bi-check" style={{ fontSize: '0.7rem', color: '#fff' }} />}
                        </div>
                      ))}
                      <input
                        type="color"
                        value={editColor || '#3b82f6'}
                        onChange={(e) => setEditColor(e.target.value)}
                        style={{ width: 24, height: 24, padding: 1, border: '2px solid #e2e8f0', cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                        title="Color personalizado"
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm flex-grow-1"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={save}
                      disabled={!editName.trim()}
                    >
                      Guardar
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {onDeleteColumn && (
            <button
              className="btn btn-sm text-secondary p-0 border-0"
              onClick={(e) => { e.stopPropagation(); onDeleteColumn(estado.id, estado.nombre); }}
              title="Eliminar columna"
            >
              <i className="bi bi-trash" />
            </button>
          )}
        </div>
      </div>

      {/* Contenedor Droppable de Tarjetas */}
      <div ref={setDroppableNodeRef} style={{ paddingRight: '2px', minHeight: '60px' }}>
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((t) => (
            <KanbanCard
              key={t.id}
              ticket={t}
              onClick={() => onSelectTicket(t)}
              onArchive={onArchiveTicket ? () => onArchiveTicket(t.id) : undefined}
            />
          ))}
        </SortableContext>
      </div>

      {/* Formulario / Botón Añadir tarjeta */}
      {adding ? (
        <div className="mt-2 bg-white p-2 rounded shadow-sm border">
          <textarea
            className="form-control form-control-sm mb-2"
            rows={2}
            autoFocus
            placeholder="Título de la tarjeta..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
            style={{ fontSize: '0.875rem', resize: 'none' }}
          />
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.82rem', fontWeight: 600 }}
              onClick={handleAdd}
            >
              Añadir
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setAdding(false); setNewTitle(''); }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-link btn-sm w-100 text-start text-decoration-none mt-1"
          style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}
          onClick={() => setAdding(true)}
        >
          <i className="bi bi-plus me-1" />Añadir tarjeta
        </button>
      )}
    </div>
  );
});
