import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext, DragStartEvent, DragOverEvent, DragEndEvent,
  DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { TableTicketRow, DroppableVersionBody } from './TableTicketRow';
import { Version, Ticket, VersionEstado } from '../../../types';
import { versionService } from '../../../services/versionService';
import toast from 'react-hot-toast';

interface Props {
  versions: Version[];
  tickets: Ticket[];
  filteredTickets: Ticket[];
  activeBoardId: number | null;
  loadBoardData: (boardId: number) => Promise<void>;
  openModal: (type: any, data?: any) => void;
  updateTicketLocal: (ticketId: number, fields: Partial<Ticket>) => void;
  setEditingVersion: (v: Version | undefined) => void;
  setVersionModalReadOnly: (readOnly: boolean) => void;
  setVersionModalOpen: (open: boolean) => void;
}

export const BoardTable: React.FC<Props> = ({
  versions,
  tickets,
  filteredTickets,
  activeBoardId,
  loadBoardData,
  openModal,
  updateTicketLocal,
  setEditingVersion,
  setVersionModalReadOnly,
  setVersionModalOpen,
}) => {
  const [tableSelections, setTableSelections] = useState<Record<number, Set<number>>>({});
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({});
  const [tableTicketOrder, setTableTicketOrder] = useState<Record<number, number[]>>({});
  const [activeTableTicketId, setActiveTableTicketId] = useState<number | null>(null);
  const [openVersionDropdown, setOpenVersionDropdown] = useState<number | null>(null);

  const tableDragCurrentVersionRef = useRef<number | null>(null);
  const tableDragOriginalVersionRef = useRef<number | null>(null);
  const tableSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (openVersionDropdown === null) return;
    const handler = () => setOpenVersionDropdown(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openVersionDropdown]);

  useEffect(() => {
    setTableTicketOrder(prev => {
      const next: Record<number, number[]> = {};
      versions.forEach(ver => {
        const ids = tickets.filter(t => t.versionId === ver.id).map(t => t.id);
        const existing = prev[ver.id] ?? [];
        const preserved = existing.filter(id => ids.includes(id));
        const added = ids.filter(id => !preserved.includes(id));
        next[ver.id] = [...preserved, ...added];
      });
      return next;
    });
  }, [versions, tickets]);

  const handleTableDragStart = (event: DragStartEvent) => {
    setActiveTableTicketId(event.active.id as number);
    const versionId = (event.active.data.current?.versionId as number) ?? null;
    tableDragCurrentVersionRef.current = versionId;
    tableDragOriginalVersionRef.current = versionId;
  };

  const handleTableDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as number;
    const overId = over.id;
    const activeVersionId = tableDragCurrentVersionRef.current;
    if (!activeVersionId) return;

    let overVersionId: number | null = null;
    if (typeof overId === 'string' && overId.startsWith('ver-')) {
      overVersionId = Number(overId.replace('ver-', ''));
    } else {
      overVersionId = (over.data.current?.versionId as number) ?? null;
    }
    if (!overVersionId || activeId === (overId as number)) return;

    if (activeVersionId === overVersionId) {
      setTableTicketOrder(prev => {
        const items = prev[activeVersionId] ?? [];
        const oldIdx = items.indexOf(activeId);
        const newIdx = typeof overId === 'number' ? items.indexOf(overId) : -1;
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
        return { ...prev, [activeVersionId]: arrayMove(items, oldIdx, newIdx) };
      });
    } else {
      tableDragCurrentVersionRef.current = overVersionId;
      setTableTicketOrder(prev => {
        const sourceItems = (prev[activeVersionId] ?? []).filter(id => id !== activeId);
        const destItems = [...(prev[overVersionId!] ?? [])];
        const overIndex = typeof overId === 'number' ? destItems.indexOf(overId as number) : destItems.length;
        destItems.splice(overIndex >= 0 ? overIndex : destItems.length, 0, activeId);
        return { ...prev, [activeVersionId]: sourceItems, [overVersionId!]: destItems };
      });
    }
  };

  const handleTableDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    const activeId = active.id as number;
    const originalVersionId = tableDragOriginalVersionRef.current;
    const currentVersionId = tableDragCurrentVersionRef.current;
    setActiveTableTicketId(null);
    tableDragCurrentVersionRef.current = null;
    tableDragOriginalVersionRef.current = null;

    if (currentVersionId && currentVersionId !== originalVersionId) {
      const targetVer = versions.find(v => v.id === currentVersionId);
      const sourceVer = versions.find(v => v.id === originalVersionId);
      if (!targetVer) return;

      // Actualización optimista en el almacén local para sincronizar el tablero y la tarjeta de inmediato
      updateTicketLocal(activeId, { versionId: currentVersionId });

      try {
        // Primero actualizamos la versión de destino secuencialmente para asociar el ticket
        await versionService.actualizarVersion(targetVer.id, {
          titulo: targetVer.titulo,
          fechaVencimiento: targetVer.fechaVencimiento!,
          tableroId: targetVer.tableroId,
          ticketIds: [...(targetVer.ticketIds ?? []).filter(id => id !== activeId), activeId],
          estado: targetVer.estado,
        });

        // Luego actualizamos la versión de origen para desasociar el ticket, de forma secuencial
        // para evitar conflictos concurrentes en la base de datos sobre la misma fila de ticket
        if (sourceVer) {
          await versionService.actualizarVersion(sourceVer.id, {
            titulo: sourceVer.titulo,
            fechaVencimiento: sourceVer.fechaVencimiento!,
            tableroId: sourceVer.tableroId,
            ticketIds: (sourceVer.ticketIds ?? []).filter(id => id !== activeId),
            estado: sourceVer.estado,
          });
        }
        if (activeBoardId) await loadBoardData(activeBoardId);
        toast.success(`Ticket movido a ${targetVer.titulo}`);
      } catch {
        toast.error('Error al mover el ticket');
        if (activeBoardId) loadBoardData(activeBoardId);
      }
    }
  };

  const toggleTicketInVersion = (verId: number, ticketId: number) => {
    setTableSelections((prev) => {
      const cur = new Set(prev[verId] ?? []);
      cur.has(ticketId) ? cur.delete(ticketId) : cur.add(ticketId);
      return { ...prev, [verId]: cur };
    });
  };

  const handleDesvincular = async (ver: Version, selectedIds: Set<number>) => {
    const newTicketIds = ver.ticketIds.filter((id) => !selectedIds.has(id));
    try {
      await versionService.actualizarVersion(ver.id, {
        titulo: ver.titulo,
        fechaVencimiento: ver.fechaVencimiento,
        tableroId: ver.tableroId,
        ticketIds: newTicketIds,
      });
      setTableSelections((prev) => ({ ...prev, [ver.id]: new Set() }));
      if (activeBoardId) loadBoardData(activeBoardId);
      toast.success(`${selectedIds.size} ticket${selectedIds.size > 1 ? 's' : ''} desvinculado${selectedIds.size > 1 ? 's' : ''}`);
    } catch {
      toast.error('Error al desvincular tickets');
    }
  };

  return (
    <DndContext
      sensors={tableSensors}
      collisionDetection={closestCenter}
      onDragStart={handleTableDragStart}
      onDragOver={handleTableDragOver}
      onDragEnd={handleTableDragEnd}
    >
      <div className="d-flex flex-column gap-4">
        {versions
          .filter(v => v.estado !== VersionEstado.CERRADO)
          .sort((a, b) => {
            const ORDER: Record<string, number> = { [VersionEstado.EN_CURSO]: 0, [VersionEstado.POR_HACER]: 1, [VersionEstado.FINALIZADO]: 2 };
            return (ORDER[a.estado] ?? 99) - (ORDER[b.estado] ?? 99);
          })
          .map(ver => {
            const STYLE: Record<string, { bg: string; border: string; tagColor: string; iconColor: string; label: string }> = {
              [VersionEstado.EN_CURSO]:   { bg: '#ede9fe', border: '#c4b5fd', tagColor: '#4c1d95', iconColor: '#6d28d9', label: 'En curso' },
              [VersionEstado.POR_HACER]:  { bg: '#f5f3ff', border: '#ddd6fe', tagColor: '#5b21b6', iconColor: '#7c3aed', label: 'Por hacer' },
              [VersionEstado.FINALIZADO]: { bg: '#faf9ff', border: '#ede9fe', tagColor: '#7c3aed', iconColor: '#a78bfa', label: 'Finalizado' },
            };
            const style = STYLE[ver.estado] ?? STYLE[VersionEstado.POR_HACER];
            const orderedIds = tableTicketOrder[ver.id] ?? filteredTickets.filter(t => t.versionId === ver.id).map(t => t.id);
            const vTickets = orderedIds.map(id => filteredTickets.find(t => t.id === id)).filter((t): t is Ticket => t !== undefined);
            const sel = tableSelections[ver.id] ?? new Set<number>();
            const hasSelection = sel.size > 0;
            const isExpanded = expandedVersions[ver.id] !== false;
            const dueDateStr = ver.fechaVencimiento
              ? new Date(ver.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            return (
              <div key={ver.id} className="card shadow-sm border-0 rounded-4">
                <div
                  className="d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ backgroundColor: style.bg, borderBottom: isExpanded ? `1px solid ${style.border}` : 'none', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setExpandedVersions(prev => ({ ...prev, [ver.id]: !isExpanded }))}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ color: style.iconColor, fontSize: '0.8rem' }} />
                    <i className="bi bi-tag-fill" style={{ color: style.iconColor }} />
                    <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{ver.titulo}</span>
                    <span className="badge rounded-pill" style={{ backgroundColor: style.border, color: style.tagColor, fontSize: '0.72rem' }}>{vTickets.length} {vTickets.length === 1 ? 'tarjeta' : 'tarjetas'}</span>
                    <span className="badge rounded-pill" style={{ backgroundColor: style.border, color: style.tagColor, fontSize: '0.68rem', opacity: 0.85 }}>{style.label}</span>
                    {dueDateStr && (
                      <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-calendar2-check" />{dueDateStr}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2" onClick={e => e.stopPropagation()}>
                    {hasSelection ? (
                      <>
                        <span className="text-secondary fw-semibold" style={{ fontSize: '0.85rem' }}>
                          {sel.size} seleccionado{sel.size > 1 ? 's' : ''}
                        </span>
                        <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => handleDesvincular(ver, sel)}>
                          <i className="bi bi-x-circle" />Desvincular
                        </button>
                        <button className="btn btn-sm btn-link text-secondary text-decoration-none p-0" onClick={() => setTableSelections(prev => ({ ...prev, [ver.id]: new Set() }))}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'none', border: 'none', color: '#64748b', padding: '2px 8px', fontSize: '1rem', lineHeight: 1 }}
                          title="Opciones"
                          onClick={e => { e.stopPropagation(); setOpenVersionDropdown(openVersionDropdown === ver.id ? null : ver.id); }}
                        >
                          <i className="bi bi-three-dots" />
                        </button>
                        {openVersionDropdown === ver.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 155, padding: '4px 0', marginTop: 4 }}>
                            <button
                              className="dropdown-item d-flex align-items-center gap-2"
                              style={{ fontSize: '0.85rem', padding: '7px 14px' }}
                              onClick={e => { e.stopPropagation(); setEditingVersion(ver); setVersionModalReadOnly(false); setVersionModalOpen(true); setOpenVersionDropdown(null); }}
                            >
                              <i className="bi bi-pencil text-secondary" />Editar versión
                            </button>
                            <button
                              className="dropdown-item d-flex align-items-center gap-2 text-danger"
                              style={{ fontSize: '0.85rem', padding: '7px 14px' }}
                              onClick={async e => {
                                e.stopPropagation();
                                setOpenVersionDropdown(null);
                                try {
                                  await versionService.eliminarVersion(ver.id);
                                  if (activeBoardId) loadBoardData(activeBoardId);
                                } catch {
                                  toast.error('Error al eliminar la versión');
                                }
                              }}
                            >
                              <i className="bi bi-trash" />Eliminar versión
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                    <div className="table-responsive" style={{ borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                      <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                          <col style={{ width: 52 }} />
                          <col style={{ width: 56 }} />
                          <col />
                          <col style={{ width: 64 }} />
                          <col style={{ width: 90 }} />
                          <col style={{ width: 130 }} />
                          <col style={{ width: 80 }} />
                        </colgroup>
                        <tbody>
                          {vTickets.length === 0 ? (
                            <DroppableVersionBody versionId={ver.id} />
                          ) : vTickets.map(t => (
                            <TableTicketRow
                              key={t.id}
                              ticket={t}
                              versionId={ver.id}
                              isSelected={sel.has(t.id)}
                              onOpen={() => openModal('ticketDetail', { ticket: t })}
                              onToggle={() => toggleTicketInVersion(ver.id, t.id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SortableContext>
                )}
              </div>
            );
          })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTableTicketId && (() => {
          const t = tickets.find(t => t.id === activeTableTicketId);
          return t ? (
            <div style={{ background: '#fff', border: '1px solid #c4b5fd', borderRadius: 8, padding: '8px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.87rem', fontWeight: 600, color: '#1e293b', maxWidth: 400 }}>
              <i className="bi bi-grip-vertical text-muted me-2" />#{t.id} {t.titulo}
            </div>
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
};
