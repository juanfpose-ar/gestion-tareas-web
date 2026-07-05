import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChecklistItem } from '../../../../types';

interface Props {
  items: ChecklistItem[];
  newItem: string;
  onNewItemChange: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
  onToggle: (id: number) => void;
  confirmDeleteId: number | null;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  onReorder: (orderedIds: number[]) => void;
}

function SortableCheckItem({
  item, onToggle, confirmDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete,
}: {
  item: ChecklistItem;
  onToggle: (id: number) => void;
  confirmDeleteId: number | null;
  onRequestDelete: (id: number) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: isDragging ? '#f8f9fa' : undefined,
        borderRadius: 6,
      }}
      className="d-flex align-items-center justify-content-between p-1"
    >
      <span
        {...attributes}
        {...listeners}
        className="text-secondary me-1 flex-shrink-0"
        style={{ cursor: 'grab', fontSize: '0.85rem', touchAction: 'none' }}
        title="Arrastrar para reordenar"
      >
        <i className="bi bi-grip-vertical" />
      </span>

      <div className="form-check mb-0 flex-grow-1">
        <input
          type="checkbox"
          className="form-check-input"
          checked={item.completado}
          onChange={() => onToggle(item.id)}
          id={`chk-${item.id}`}
        />
        <label
          htmlFor={`chk-${item.id}`}
          className={`form-check-label ms-2 ${item.completado ? 'text-decoration-line-through text-muted' : 'text-dark'}`}
          style={{ fontSize: '0.9rem' }}
        >
          {item.texto || item.contenido || 'Elemento sin título'}
        </label>
      </div>

      <div className="flex-shrink-0">
        {confirmDeleteId === item.id ? (
          <span className="d-inline-flex align-items-center gap-1 ms-1" style={{ fontSize: '0.8rem' }}>
            <span className="text-danger">¿Seguro?</span>
            <button className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => onConfirmDelete(item.id)}>Sí</button>
            <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={onCancelDelete}>No</button>
          </span>
        ) : (
          <button className="btn btn-sm text-secondary p-0 border-0" onClick={() => onRequestDelete(item.id)}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>
    </div>
  );
}

export const ChecklistSection: React.FC<Props> = ({
  items, newItem, onNewItemChange, onAdd,
  onToggle, confirmDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete, onReorder,
}) => {
  const completed = items.filter((c) => c.completado).length;
  const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    onReorder(reordered.map((i) => i.id));
  };

  return (
    <div id="sec-checklists" className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
          <i className="bi bi-check2-square me-1" /> LISTA DE TAREAS
        </div>
        <span className="text-secondary small ms-auto">{completed}/{items.length}</span>
      </div>

      <div className="progress mb-3" style={{ height: '8px', borderRadius: '4px' }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${percent}%`, backgroundColor: '#5cb85c' }} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="d-flex flex-column gap-1 mb-3">
            {items.map((item) => (
              <SortableCheckItem
                key={item.id}
                item={item}
                onToggle={onToggle}
                confirmDeleteId={confirmDeleteId}
                onRequestDelete={onRequestDelete}
                onConfirmDelete={onConfirmDelete}
                onCancelDelete={onCancelDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <form onSubmit={onAdd} className="d-flex gap-2">
        <input
          type="text"
          className="form-control form-control-sm border-0 border-bottom rounded-0"
          placeholder="Añade un elemento..."
          value={newItem}
          onChange={(e) => onNewItemChange(e.target.value)}
        />
        <button type="submit" className="btn btn-sm btn-outline-secondary px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          Añadir
        </button>
      </form>
    </div>
  );
};
