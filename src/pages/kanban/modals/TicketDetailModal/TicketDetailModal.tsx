import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Ticket, EstadoTablero, ChecklistItem, NotaTarea,
  Recordatorio, Adjunto, TipoRecordatorio, Prioridad, Etiqueta, VinculoDTO, Usuario
} from '../../../../types';
import {
  checklistService, notaService, recordatorioService, adjuntoService, vinculoService
} from '../../../../services/itemServices';
import { etiquetaService } from '../../../../services/etiquetaService';
import { ticketService } from '../../../../services/ticketService';
import { tableroService } from '../../../../services/tableroService';
import { useBoardStore } from '../../../../stores/boardStore';
import { useUiStore } from '../../../../stores/uiStore';
import { VincularTicketModal } from '../VincularTicketModal';
import { TicketHeader } from './TicketHeader';
import { DescriptionEditor } from './DescriptionEditor';
import { ChecklistSection } from './ChecklistSection';
import { RecordatoriosSection } from './RecordatoriosSection';
import { AdjuntosSection } from './AdjuntosSection';
import { NotasSection } from './NotasSection';
import { EtiquetaCrearPanel } from '../../../../components/EtiquetaCrearPanel';
import { getContrastColor } from '../../../../utils/colorUtils';

interface Props {
  ticket: Ticket | null;
  estados: EstadoTablero[];
  allTickets: Ticket[];
  onClose: () => void;
  onUpdateTicket: () => Promise<void>;
  readOnly?: boolean;
  onDesarchivar?: () => void;
}


export const TicketDetailModal: React.FC<Props> = ({ ticket, estados, allTickets, onClose, onUpdateTicket, readOnly, onDesarchivar }) => {
  const { setSelectedTicket } = useUiStore();
  const { updateTicketEstado, updateTicketLocal } = useBoardStore();

  const [fullTicket, setFullTicket] = useState<Ticket | null>(null);
  const [navStack, setNavStack] = useState<Array<{ id: number; titulo: string }>>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [notas, setNotas] = useState<NotaTarea[]>([]);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [vinculos, setVinculos] = useState<VinculoDTO[]>([]);
  const [boardEtiquetas, setBoardEtiquetas] = useState<Etiqueta[]>([]);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loadedTicketId, setLoadedTicketId] = useState<number | null>(null);
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState(false);
  const [lastKnownFechaModificacion, setLastKnownFechaModificacion] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const [newCheckItem, setNewCheckItem] = useState('');
  const [confirmDeleteCheckId, setConfirmDeleteCheckId] = useState<number | null>(null);
  const [confirmDeleteAdjId, setConfirmDeleteAdjId] = useState<number | null>(null);
  const [confirmDeleteNotaId, setConfirmDeleteNotaId] = useState<number | null>(null);
  const [confirmDeleteEtqId, setConfirmDeleteEtqId] = useState<number | null>(null);
  const [confirmDeleteVinculoId, setConfirmDeleteVinculoId] = useState<number | null>(null);

  const [newNota, setNewNota] = useState('');
  const [editingNotaId, setEditingNotaId] = useState<number | null>(null);
  const [editingNotaTexto, setEditingNotaTexto] = useState('');

  const [showCustomRec, setShowCustomRec] = useState(false);
  const [customRecFecha, setCustomRecFecha] = useState('');

  const [showAdjuntoForm, setShowAdjuntoForm] = useState(false);
  const [adjuntoTab, setAdjuntoTab] = useState<'archivo' | 'enlace'>('archivo');
  const [adjuntoUrl, setAdjuntoUrl] = useState('');
  const [adjuntoNombre, setAdjuntoNombre] = useState('');

  const [showVincularModal, setShowVincularModal] = useState(false);
  const [showFechas, setShowFechas] = useState(true);
  const [confirmClearDate, setConfirmClearDate] = useState(false);
  const [showTareas, setShowTareas] = useState(true);
  const [showVinculos, setShowVinculos] = useState(true);
  const [showRecordatorios, setShowRecordatorios] = useState(true);
  const [showAdjuntos, setShowAdjuntos] = useState(true);
  const [showUsuarios, setShowUsuarios] = useState(true);
  const [showInformados, setShowInformados] = useState(true);
  const [boardMembers, setBoardMembers] = useState<Usuario[]>([]);
  const [asignados, setAsignados] = useState<Usuario[]>([]);
  const [informados, setInformados] = useState<Usuario[]>([]);

  const [showEtqMenu, setShowEtqMenu] = useState(false);
  const [creatingEtq, setCreatingEtq] = useState(false);

  const etqMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket && ticket.id !== loadedTicketId) {
      setLoadedTicketId(ticket.id);
      setDescText(ticket.descripcion || '');
      setTitleText(ticket.titulo || '');
      setDueDate(ticket.fechaVencimiento ? ticket.fechaVencimiento.split('T')[0] : '');
      setShowFechas(true);
      setShowTareas(true);
      setShowVinculos(true);
      setShowRecordatorios(true);
      setShowAdjuntos(true);
      setShowUsuarios(true);
      setShowInformados(true);
      setConflictWarning(null);
      loadDetails(ticket.id);
    }
  }, [ticket, loadedTicketId]);

  useEffect(() => {
    if (!showEtqMenu) return;
    const h = (e: MouseEvent) => {
      if (etqMenuRef.current && !etqMenuRef.current.contains(e.target as Node)) {
        setShowEtqMenu(false);
        setCreatingEtq(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showEtqMenu]);

  const loadDetails = async (ticketId: number) => {
    try {
      const t = await ticketService.getTicketById(ticketId);
      setFullTicket(t);
      setLastKnownFechaModificacion(t.fechaModificacion || null);
      if (t.fechaVencimiento) setDueDate(t.fechaVencimiento.split('T')[0]);
      else setDueDate('');
      if (t.descripcion) setDescText(t.descripcion);

      const boardId = t.tableroId;
      const [c, n, r, a, v] = await Promise.all([
        checklistService.getByTicket(ticketId),
        notaService.getByTicket(ticketId),
        recordatorioService.getByTicket(ticketId),
        adjuntoService.getByTicket(ticketId),
        vinculoService.getByTicket(ticketId),
      ]);
      setChecklists(c); setNotas(n); setRecordatorios(r); setAdjuntos(a); setVinculos(v);
      setAsignados(t.asignados || []);
      setInformados(t.informados || []);
      if (boardId) {
        setBoardEtiquetas(await etiquetaService.getEtiquetasByTablero(boardId));
        tableroService.getMiembros(boardId).then(setBoardMembers).catch(() => {});
      }
    } catch (err) {
      console.error('Error al cargar detalles', err);
    }
  };

  if (!ticket) return null;

  const activeTicket = fullTicket || ticket;
  const { id: ticketId, titulo: activeTitulo, descripcion: activeDescripcion = '', prioridad: activePrioridad, estadoId: activeEstadoId, etiquetas: activeEtiquetas = [], fechaVencimiento: activeFechaVencimiento, tableroId: activeTableroId, completado: activeCompletado = false } = activeTicket;

  const buildTicketPayload = (overrides: Partial<{ titulo: string; descripcion: string; prioridad: Prioridad; etiquetasIds: number[]; fechaVencimiento: string | undefined }> = {}) => ({
    titulo: titleText.trim() || activeTitulo,
    descripcion: descText,
    prioridad: activePrioridad,
    tableroId: activeTableroId,
    estadoId: activeEstadoId,
    etiquetasIds: activeEtiquetas.map((t) => t.id),
    fechaVencimiento: dueDate || undefined,
    fechaModificacion: lastKnownFechaModificacion || undefined,
    ...overrides,
  });

  const callActualizarTicket = async (payload: ReturnType<typeof buildTicketPayload>): Promise<boolean> => {
    try {
      const updated = await ticketService.actualizarTicket(ticketId, payload);
      updateTicketLocal(ticketId, updated);
      setConflictWarning(null);
      return true;
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setConflictWarning(err.response?.data?.message || 'El ticket fue modificado por otro usuario mientras lo editabas.');
        return false;
      }
      throw err;
    }
  };

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeFechaVencimiento) {
      toast.error('No se puede cambiar el estado de un ticket sin fecha de vencimiento');
      return;
    }
    if (!activeTicket.versionId) {
      toast.error('No se puede cambiar el estado de un ticket sin versión asignada');
      return;
    }
    const newStateId = Number(e.target.value);
    setSelectedTicket({ ...activeTicket, estadoId: newStateId });
    await updateTicketEstado(ticketId, newStateId);
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleCompletadoChange = async (nextVal: boolean) => {
    updateTicketLocal(ticketId, { completado: nextVal });
    if (fullTicket) {
      setFullTicket({ ...fullTicket, completado: nextVal });
    } else {
      setSelectedTicket({ ...activeTicket, completado: nextVal });
    }

    try {
      await ticketService.cambiarCompletado(ticketId, nextVal);
      await loadDetails(ticketId);
      await onUpdateTicket();
    } catch {
      toast.error('Error al cambiar el estado de completado');
      updateTicketLocal(ticketId, { completado: activeCompletado });
      if (fullTicket) {
        setFullTicket({ ...fullTicket, completado: activeCompletado });
      } else {
        setSelectedTicket({ ...activeTicket, completado: activeCompletado });
      }
    }
  };

  const handlePriorityChange = async (p: Prioridad) => {
    const ok = await callActualizarTicket(buildTicketPayload({ prioridad: p }));
    if (!ok) return;
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleSaveTitle = async () => {
    if (!titleText.trim()) return;
    const ok = await callActualizarTicket(buildTicketPayload({ titulo: titleText.trim() }));
    if (!ok) return;
    setEditingTitle(false);
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleSaveDescription = async () => {
    const ok = await callActualizarTicket(buildTicketPayload({ descripcion: descText }));
    if (!ok) return;
    setEditingDesc(false);
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleClearDueDate = async () => {
    setDueDate('');
    setConfirmClearDate(false);
    const ok = await callActualizarTicket(buildTicketPayload({ fechaVencimiento: '' }));
    if (!ok) return;
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    const ok = await callActualizarTicket(buildTicketPayload({ fechaVencimiento: val }));
    if (!ok) return;
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleConfirmDeleteTicket = async () => {
    await ticketService.eliminarTicket(ticketId);
    await onUpdateTicket();
    onClose();
  };

  const handleToggleEtiqueta = async (etq: Etiqueta) => {
    const exists = activeEtiquetas.some((t) => t.id === etq.id);
    const newTagsIds = exists
      ? activeEtiquetas.filter((t) => t.id !== etq.id).map((t) => t.id)
      : [...activeEtiquetas.map((t) => t.id), etq.id];
    const ok = await callActualizarTicket(buildTicketPayload({ etiquetasIds: newTagsIds }));
    if (!ok) return;
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleCreateEtiqueta = async (nombre: string, colorHex: string, colorTexto: string) => {
    await etiquetaService.crearEtiqueta({ nombre, colorHex, colorTexto, tableroId: activeTableroId });
    setCreatingEtq(false);
    if (activeTableroId) setBoardEtiquetas(await etiquetaService.getEtiquetasByTablero(activeTableroId));
  };

  const handleDeleteEtiquetaBoard = async (etqId: number) => {
    await etiquetaService.eliminarEtiqueta(etqId);
    setConfirmDeleteEtqId(null);
    if (activeTableroId) setBoardEtiquetas(await etiquetaService.getEtiquetasByTablero(activeTableroId));
    await loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const created = await checklistService.crearItem(ticketId, newCheckItem.trim());
    setChecklists((prev) => [...prev, created]);
    setNewCheckItem('');
    await onUpdateTicket();
  };

  const handleToggleChecklist = async (id: number) => {
    setChecklists((prev) => prev.map((item) => (item.id === id ? { ...item, completado: !item.completado } : item)));
    await checklistService.toggleCompletado(ticketId, id);
    await onUpdateTicket();
  };

  const handleDeleteChecklist = async (id: number) => {
    setConfirmDeleteCheckId(null);
    setChecklists((prev) => prev.filter((item) => item.id !== id));
    await checklistService.eliminarItem(ticketId, id);
    await onUpdateTicket();
  };

  const handleReorderChecklist = async (orderedIds: number[]) => {
    setChecklists((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      return orderedIds.map((id) => map.get(id)!).filter(Boolean);
    });
    await checklistService.reordenar(ticketId, orderedIds);
    await onUpdateTicket();
  };

  const isEditNotaAllowed = (fechaCreacion?: string): boolean => {
    if (!fechaCreacion) return true;
    return (new Date().getTime() - new Date(fechaCreacion).getTime()) / 3600000 <= 1;
  };

  const getAdjuntoBadge = (a: Adjunto) => {
    if ((a.tipoAdjunto || '').toUpperCase() === 'ENLACE') return { text: 'ENLACE', bgColor: '#8b5cf6' };
    const ext = a.nombreArchivo?.split('.').pop()?.toUpperCase() ?? '';
    if (!ext || ext === a.nombreArchivo || ext.length > 5) return { text: 'ARCHIVO', bgColor: '#475569' };
    const colors: Record<string, string> = {
      PDF: '#ef4444', PNG: '#3b82f6', JPG: '#3b82f6', JPEG: '#3b82f6', GIF: '#3b82f6', WEBP: '#3b82f6', SVG: '#3b82f6',
      XLS: '#10b981', XLSX: '#10b981', CSV: '#10b981', DOC: '#6366f1', DOCX: '#6366f1', TXT: '#6366f1',
      PPT: '#f59e0b', PPTX: '#f59e0b', ZIP: '#f97316', RAR: '#f97316',
    };
    return { text: ext, bgColor: colors[ext] ?? '#475569' };
  };

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNota.trim()) return;
    await notaService.crearNota(ticketId, newNota.trim());
    setNewNota('');
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleSaveEditNota = async (id: number) => {
    if (!editingNotaTexto.trim()) return;
    await notaService.actualizarNota(ticketId, id, editingNotaTexto.trim());
    setEditingNotaId(null);
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleDeleteNota = async (id: number) => {
    await notaService.eliminarNota(ticketId, id);
    setConfirmDeleteNotaId(null);
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleToggleRecordatorio = async (tipo: TipoRecordatorio, customDateStr?: string) => {
    const existing = recordatorios.find(
      (r) => (r.tipo || '').toUpperCase() === tipo.toUpperCase() || (r.tipoRecordatorio || '').toUpperCase() === tipo.toUpperCase()
    );
    if (existing) {
      await recordatorioService.eliminarRecordatorio(ticketId, existing.id);
      setRecordatorios((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      try {
        let dateVal = customDateStr;
        if (tipo === TipoRecordatorio.PERSONALIZADO && dateVal?.length === 16) dateVal += ':00';
        const created = await recordatorioService.crearRecordatorio(ticketId, dateVal, tipo);
        setRecordatorios((prev) => [...prev, created]);
      } catch (err: any) {
        toast.error('No se pudo crear el recordatorio: ' + (err.response?.data?.message || err.message || 'Error desconocido'));
      }
    }
    setShowCustomRec(false);
    setCustomRecFecha('');
    await onUpdateTicket();
  };

  const handleDeleteRecordatorio = async (id: number) => {
    await recordatorioService.eliminarRecordatorio(ticketId, id);
    setRecordatorios((prev) => prev.filter((r) => r.id !== id));
    await onUpdateTicket();
  };

  const handleUploadArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await adjuntoService.subirArchivo(ticketId, file);
    setShowAdjuntoForm(false);
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleAddEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjuntoUrl.trim()) return;
    await adjuntoService.crearEnlace(ticketId, adjuntoUrl.trim(), adjuntoNombre.trim() || undefined);
    setAdjuntoUrl(''); setAdjuntoNombre(''); setShowAdjuntoForm(false);
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const handleDeleteAdjunto = async (id: number) => {
    await adjuntoService.eliminarAdjunto(ticketId, id);
    setConfirmDeleteAdjId(null);
    loadDetails(ticketId);
    await onUpdateTicket();
  };

  const resetEditState = () => {
    setEditingDesc(false);
    setEditingTitle(false);
    setConfirmDeleteVinculoId(null);
    setConfirmDeleteCheckId(null);
    setConfirmDeleteAdjId(null);
    setConfirmDeleteNotaId(null);
    setNewNota('');
    setNewCheckItem('');
  };

  const navigateTo = (linkedId: number) => {
    const currentId = fullTicket?.id ?? ticket?.id;
    const currentTitle = fullTicket?.titulo ?? ticket?.titulo ?? '';
    if (!currentId) return;
    setNavStack((prev) => [...prev, { id: currentId, titulo: currentTitle }]);
    resetEditState();
    loadDetails(linkedId);
  };
  void navigateTo;

  const navigateBack = () => {
    setNavStack((prev) => {
      const next = [...prev];
      const target = next.pop();
      if (target) {
        resetEditState();
        loadDetails(target.id);
      }
      return next;
    });
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ maxWidth: '780px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>

          {navStack.length > 0 && (
            <div
              className="d-flex align-items-center px-4 py-2 border-bottom"
              style={{ backgroundColor: '#f8f9fa', borderRadius: '16px 16px 0 0' }}
            >
              <button
                className="btn btn-sm btn-link p-0 d-flex align-items-center gap-1 text-primary"
                style={{ fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600 }}
                onClick={navigateBack}
              >
                <i className="bi bi-arrow-left" /> Volver
              </button>
            </div>
          )}

          <TicketHeader
            ticketId={ticketId}
            titulo={activeTitulo}
            estados={estados}
            activeEstadoId={activeEstadoId}
            activePrioridad={activePrioridad}
            editingTitle={editingTitle}
            titleText={titleText}
            versionId={activeTicket.versionId}
            onTitleTextChange={setTitleText}
            onStartEditTitle={() => setEditingTitle(true)}
            onSaveTitle={handleSaveTitle}
            onCancelEditTitle={() => { setEditingTitle(false); setTitleText(activeTitulo); }}
            onStateChange={handleStateChange}
            onPriorityChange={handlePriorityChange}
            onClose={onClose}
            readOnly={readOnly}
            completado={activeCompletado}
            onCompletadoChange={handleCompletadoChange}
          />

          <div className="modal-body px-4 py-2">

            {conflictWarning && (
              <div className="alert alert-danger d-flex flex-column gap-2 p-3 mb-3 shadow-sm" style={{ borderRadius: 8, fontSize: '0.88rem' }}>
                <div className="d-flex align-items-center gap-2 text-danger fw-bold">
                  <i className="bi bi-exclamation-triangle-fill fs-5" />
                  <span>Conflicto de modificación</span>
                </div>
                <div className="text-secondary text-dark">
                  {conflictWarning}
                </div>
                <div className="d-flex justify-content-end gap-2 mt-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger px-3 py-1"
                    style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' }}
                    onClick={async () => {
                      setConflictWarning(null);
                      await loadDetails(ticketId);
                      await onUpdateTicket();
                    }}
                  >
                    Recargar Cambios
                  </button>
                </div>
              </div>
            )}

            {readOnly && (
              <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ borderRadius: 8, fontSize: '0.88rem' }}>
                <i className="bi bi-archive-fill" />
                <span className="fw-semibold">Ticket archivado — solo lectura</span>
              </div>
            )}

            <div style={{ pointerEvents: readOnly ? 'none' : 'auto' }}>

            {/* QUICK PILLS */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              {[
                { label: 'Fechas', icon: 'bi-calendar2', count: null, active: !!(dueDate || activeFechaVencimiento), onClick: () => setShowFechas(!showFechas) },
                { label: 'Recordatorios', icon: 'bi-bell', count: recordatorios.length, active: recordatorios.length > 0, onClick: () => setShowRecordatorios(!showRecordatorios) },
                { label: 'Tareas', icon: 'bi-check2-square', count: checklists.length, active: checklists.length > 0, onClick: () => setShowTareas(!showTareas) },
                { label: 'Vínculos', icon: 'bi-link-45deg', count: vinculos.length, active: vinculos.length > 0, onClick: () => setShowVinculos(!showVinculos) },
                { label: 'Adjuntos', icon: 'bi-paperclip', count: adjuntos.length, active: adjuntos.length > 0, onClick: () => setShowAdjuntos(!showAdjuntos) },
                { label: 'Usuarios', icon: 'bi-people', count: asignados.length, active: asignados.length > 0, onClick: () => setShowUsuarios(!showUsuarios) },
                { label: 'Informados', icon: 'bi-eye', count: informados.length, active: informados.length > 0, onClick: () => setShowInformados((v) => !v) },
              ].map(({ label, icon, count, active, onClick }) => (
                <button
                  key={label}
                  className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${active ? 'bg-success text-white border-success' : 'btn-outline-secondary'}`}
                  style={{ fontSize: '0.8rem', fontWeight: 600 }}
                  onClick={onClick}
                >
                  <i className={`bi ${icon}`} /> {label}
                  {count !== null && (
                    <span className={`badge rounded-circle ms-1 ${active ? 'bg-white text-success' : 'bg-secondary text-white'}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* USUARIOS ASIGNADOS */}
            {showUsuarios && (
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                  <i className="bi bi-people me-1" /> USUARIOS ASIGNADOS
                </div>
                {boardMembers.length === 0 ? (
                  <p className="text-muted small fst-italic">No hay usuarios asignados al tablero.</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {boardMembers.map((u) => {
                      const isAssigned = asignados.some((a) => a.id === u.id);
                      const initials = (u.nombreCompleto || u.username || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <button
                          key={u.id}
                          title={u.nombreCompleto || u.username}
                          className="d-flex align-items-center gap-2 btn btn-sm rounded-pill px-3 py-1"
                          style={{
                            border: isAssigned ? '2px solid #e91e63' : '2px solid #dee2e6',
                            backgroundColor: isAssigned ? '#fce7f3' : '#f8f9fa',
                            color: isAssigned ? '#9d174d' : '#6c757d',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                          onClick={async () => {
                            let nextAsignados: Usuario[];
                            if (isAssigned) {
                              await ticketService.desasignarUsuario(ticketId, u.id);
                              nextAsignados = asignados.filter((a) => a.id !== u.id);
                            } else {
                              await ticketService.asignarUsuario(ticketId, u.id);
                              nextAsignados = [...asignados, u];
                            }
                            setAsignados(nextAsignados);
                            updateTicketLocal(ticketId, {
                              asignados: nextAsignados,
                              asignadosCard: nextAsignados.map(a => ({ id: a.id, username: a.username, nombreCompleto: a.nombreCompleto, colorAvatar: a.colorAvatar })),
                            });
                            await onUpdateTicket();
                          }}
                        >
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{ width: 24, height: 24, fontSize: '0.65rem', backgroundColor: isAssigned ? '#e91e63' : '#adb5bd' }}
                          >
                            {initials}
                          </span>
                          {u.nombreCompleto || u.username}
                          {isAssigned && <i className="bi bi-check-lg" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ETIQUETAS */}
            <div className="mb-4 position-relative" ref={etqMenuRef}>
              <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                <i className="bi bi-tag me-1" /> ETIQUETAS
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                {activeEtiquetas.map((e) => (
                  <span key={e.id} className="badge px-3 py-2 rounded-2" style={{ backgroundColor: e.colorHex || '#3b82f6', color: getContrastColor(e.colorHex || '#3b82f6'), fontSize: '0.82rem', fontWeight: 600 }}>
                    {e.nombre}
                  </span>
                ))}
                <button className="btn btn-sm btn-outline-secondary rounded-2 px-2 py-1" style={{ fontSize: '0.8rem' }} onClick={() => { setShowEtqMenu(!showEtqMenu); setCreatingEtq(false); }}>
                  +
                </button>
              </div>

              {showEtqMenu && (
                <div className="bg-white border rounded shadow-sm" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 30, width: 350, padding: 12 }}>
                  {!creatingEtq ? (
                    <>
                      <div className="fw-bold text-dark mb-2" style={{ fontSize: '0.82rem' }}>Etiquetas del tablero / Globales</div>
                      <div className="d-flex flex-column gap-1" style={{ maxHeight: 192, overflowY: 'auto' }}>
                        {boardEtiquetas.map((etq) => {
                          const sel = activeEtiquetas.some((t) => t.id === etq.id);
                          return (
                            <div key={etq.id} className="d-flex align-items-center justify-content-between px-2 py-1 rounded" style={{ backgroundColor: sel ? '#f0f4ff' : 'transparent' }}>
                              <div className="d-flex align-items-center gap-2 flex-grow-1 cursor-pointer" onClick={() => handleToggleEtiqueta(etq)}>
                                <span style={{ width: 32, height: 18, backgroundColor: etq.colorHex || '#3b82f6', borderRadius: 3, display: 'inline-block', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                                  {etq.nombre}
                                  {!etq.tableroId && <span className="badge bg-light text-secondary ms-1 border" style={{ fontSize: '0.7rem' }}>Global</span>}
                                </span>
                                {sel && <i className="bi bi-check text-success ms-1" />}
                              </div>
                              {confirmDeleteEtqId === etq.id ? (
                                <span className="d-flex align-items-center gap-1">
                                  <span className="text-danger" style={{ fontSize: '0.7rem' }}>¿Borrar?</span>
                                  <button className="btn btn-danger btn-sm py-0 px-1" style={{ fontSize: '0.7rem' }} onClick={() => handleDeleteEtiquetaBoard(etq.id)}>Sí</button>
                                  <button className="btn btn-outline-secondary btn-sm py-0 px-1" style={{ fontSize: '0.7rem' }} onClick={() => setConfirmDeleteEtqId(null)}>No</button>
                                </span>
                              ) : (
                                <button className="btn btn-link text-muted p-0 border-0 ms-2" style={{ fontSize: '0.75rem' }} onClick={(ev) => { ev.stopPropagation(); setConfirmDeleteEtqId(etq.id); }}>
                                  <i className="bi bi-trash" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <hr className="my-2" />
                      <button className="btn btn-link btn-sm p-0 text-decoration-none text-primary" style={{ fontSize: '0.8rem' }} onClick={() => setCreatingEtq(true)}>
                        + Crear etiqueta
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <button type="button" className="btn btn-sm btn-link p-0 text-secondary" onClick={() => setCreatingEtq(false)}>
                          <i className="bi bi-chevron-left" />
                        </button>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Crear etiqueta</span>
                        <button type="button" className="btn btn-sm btn-link p-0 text-secondary" onClick={() => setShowEtqMenu(false)}>
                          <i className="bi bi-x" style={{ fontSize: '1.2rem' }} />
                        </button>
                      </div>
                      <EtiquetaCrearPanel
                        autoFocus
                        onSubmit={handleCreateEtiqueta}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            <DescriptionEditor
              value={descText}
              onChange={setDescText}
              isEditing={editingDesc}
              onStartEdit={() => setEditingDesc(true)}
              onSave={handleSaveDescription}
              onCancel={() => { setEditingDesc(false); setDescText(activeDescripcion); }}
            />

            {showFechas && (
              <div id="sec-fechas" className="mb-4">
                <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                  <i className="bi bi-calendar2 me-1" /> FECHA DE VENCIMIENTO
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <input type="date" className="form-control form-control-sm border-0 bg-light" style={{ width: '180px', borderRadius: '6px' }} value={dueDate} onChange={handleDueDateChange} />
                  {dueDate && !confirmClearDate && (
                    <button className="btn btn-sm btn-link p-0 text-muted" title="Quitar fecha" onClick={() => setConfirmClearDate(true)}>
                      <i className="bi bi-x-circle" />
                    </button>
                  )}
                  {dueDate && confirmClearDate && (
                    <div className="d-flex align-items-center gap-1">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>¿Seguro?</span>
                      <button className="btn btn-sm btn-danger py-0 px-2" style={{ fontSize: '0.78rem' }} onClick={handleClearDueDate}>Sí</button>
                      <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.78rem' }} onClick={() => setConfirmClearDate(false)}>No</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showRecordatorios && (
              <RecordatoriosSection
                recordatorios={recordatorios}
                showCustomRec={showCustomRec}
                customRecFecha={customRecFecha}
                onCustomRecFechaChange={setCustomRecFecha}
                onToggleCustomRec={() => setShowCustomRec(!showCustomRec)}
                onTogglePreset={(tipo) => handleToggleRecordatorio(tipo)}
                onAddCustom={() => handleToggleRecordatorio(TipoRecordatorio.PERSONALIZADO, customRecFecha)}
                onDelete={handleDeleteRecordatorio}
              />
            )}

            {showTareas && (
              <ChecklistSection
                items={checklists}
                newItem={newCheckItem}
                onNewItemChange={setNewCheckItem}
                onAdd={handleAddChecklist}
                onToggle={handleToggleChecklist}
                confirmDeleteId={confirmDeleteCheckId}
                onRequestDelete={setConfirmDeleteCheckId}
                onConfirmDelete={handleDeleteChecklist}
                onCancelDelete={() => setConfirmDeleteCheckId(null)}
                onReorder={handleReorderChecklist}
              />
            )}

            {showAdjuntos && (
              <AdjuntosSection
                adjuntos={adjuntos}
                showForm={showAdjuntoForm}
                onToggleForm={() => setShowAdjuntoForm(!showAdjuntoForm)}
                adjuntoTab={adjuntoTab}
                onTabChange={setAdjuntoTab}
                adjuntoUrl={adjuntoUrl}
                onUrlChange={setAdjuntoUrl}
                adjuntoNombre={adjuntoNombre}
                onNombreChange={setAdjuntoNombre}
                onUploadArchivo={handleUploadArchivo}
                onAddEnlace={handleAddEnlace}
                confirmDeleteAdjId={confirmDeleteAdjId}
                onRequestDelete={setConfirmDeleteAdjId}
                onConfirmDelete={handleDeleteAdjunto}
                onCancelDelete={() => setConfirmDeleteAdjId(null)}
                getBadge={getAdjuntoBadge}
              />
            )}

            {/* VÍNCULOS */}
            {showVinculos && (
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                    <i className="bi bi-link-45deg me-1" /> TICKETS VINCULADOS {vinculos.length > 0 && `(${vinculos.length})`}
                  </div>
                  <button className="btn btn-sm btn-outline-secondary px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }} onClick={() => setShowVincularModal(true)}>
                    Vincular
                  </button>
                </div>
                {vinculos.length === 0 ? (
                  <p className="text-muted small fst-italic mb-0">Sin tickets vinculados.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {vinculos.map((v) => {
                      const linkedId = v.ticketOrigenId === ticketId ? v.ticketDestinoId : v.ticketOrigenId;
                      const linkedTitle = (v.ticketOrigenId === ticketId ? v.ticketDestinoTitulo : v.ticketOrigenTitulo) ?? `Ticket #${linkedId}`;
                      const linkedTicket = allTickets.find((t) => t.id === linkedId);
                      const P_BG: Record<string, string> = { ALTA: '#fee2e2', MEDIA: '#fef3c7', BAJA: '#dcfce7', URGENTE: '#fce7f3' };
                      const P_COLOR: Record<string, string> = { ALTA: '#b91c1c', MEDIA: '#b45309', BAJA: '#15803d', URGENTE: '#9d174d' };
                      return (
                        <div
                          key={v.id}
                          className="d-flex align-items-center justify-content-between p-2 rounded-2 border"
                          style={{
                            backgroundColor: confirmDeleteVinculoId === v.id ? '#fff1f2' : '#f8fafc',
                            cursor: confirmDeleteVinculoId === v.id ? 'default' : 'pointer',
                            transition: 'background 0.12s',
                          }}
                          onClick={() => { if (confirmDeleteVinculoId !== v.id) navigateTo(linkedId); }}
                          onMouseEnter={(e) => { if (confirmDeleteVinculoId !== v.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f4ff'; }}
                          onMouseLeave={(e) => { if (confirmDeleteVinculoId !== v.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                        >
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="badge bg-secondary" style={{ fontSize: '0.75rem', minWidth: 36 }}>#{linkedId}</span>
                            <span className="fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>{linkedTitle}</span>
                            {linkedTicket && (
                              <span className="badge rounded-pill" style={{ fontSize: '0.7rem', backgroundColor: P_BG[linkedTicket.prioridad] ?? '#e9ecef', color: P_COLOR[linkedTicket.prioridad] ?? '#475569' }}>
                                {linkedTicket.prioridad}
                              </span>
                            )}
                            {linkedTicket?.estadoNombre && (
                              <span className="badge rounded-pill bg-white border text-secondary" style={{ fontSize: '0.7rem' }}>{linkedTicket.estadoNombre}</span>
                            )}
                            {linkedTicket?.fechaVencimiento && (
                              <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-calendar2" />{new Date(linkedTicket.fechaVencimiento).toLocaleDateString()}
                              </span>
                            )}
                            <i className="bi bi-arrow-right-short text-muted" style={{ fontSize: '0.85rem' }} />
                          </div>
                          {confirmDeleteVinculoId === v.id ? (
                            <span className="d-inline-flex align-items-center gap-1 ms-2 flex-shrink-0" style={{ fontSize: '0.8rem' }} onClick={(e) => e.stopPropagation()}>
                              <span className="text-danger fw-bold">¿Seguro?</span>
                              <button className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={async (e) => { e.stopPropagation(); await vinculoService.eliminarVinculo(v.id); setConfirmDeleteVinculoId(null); loadDetails(ticketId); onUpdateTicket(); }}>Sí</button>
                              <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteVinculoId(null); }}>No</button>
                            </span>
                          ) : (
                            <button className="btn btn-sm text-secondary border-0 p-1 ms-2 flex-shrink-0" title="Eliminar vínculo" onClick={(e) => { e.stopPropagation(); setConfirmDeleteVinculoId(v.id); }}>
                              <i className="bi bi-x-lg" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* INFORMADOS */}
            {showInformados && (
              <div className="mb-4">
                <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                  <i className="bi bi-eye me-1" /> INFORMADOS
                </div>
                {(() => {
                  const asignadoIds = new Set(asignados.map((a) => a.id));
                  const candidates = boardMembers.filter((u) => !asignadoIds.has(u.id));
                  if (candidates.length === 0) {
                    return <p className="text-muted small fst-italic">No hay usuarios disponibles para observar.</p>;
                  }
                  return (
                    <div className="d-flex flex-wrap gap-2">
                      {candidates.map((u) => {
                        const isObserving = informados.some((o) => o.id === u.id);
                        const initials = (u.nombreCompleto || u.username || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                        return (
                          <button
                            key={u.id}
                            title={u.nombreCompleto || u.username}
                            className="d-flex align-items-center gap-2 btn btn-sm rounded-pill px-3 py-1"
                            style={{
                              border: isObserving ? '2px solid #6366f1' : '2px solid #dee2e6',
                              backgroundColor: isObserving ? '#eef2ff' : '#f8f9fa',
                              color: isObserving ? '#4338ca' : '#6c757d',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                            onClick={async () => {
                              try {
                                const updated = isObserving
                                  ? await ticketService.desasignarInformado(ticketId, u.id)
                                  : await ticketService.asignarInformado(ticketId, u.id);
                                setInformados(updated.informados || []);
                                await onUpdateTicket();
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || 'No se pudo actualizar informados');
                              }
                            }}
                          >
                            <span
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                              style={{ width: 24, height: 24, fontSize: '0.65rem', backgroundColor: isObserving ? '#6366f1' : '#adb5bd' }}
                            >
                              {initials}
                            </span>
                            {u.nombreCompleto || u.username}
                            {isObserving && <i className="bi bi-check-lg" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            <NotasSection
              notas={notas}
              newNota={newNota}
              onNewNotaChange={setNewNota}
              onAdd={handleAddNota}
              editingNotaId={editingNotaId}
              editingNotaTexto={editingNotaTexto}
              onEditingTextoChange={setEditingNotaTexto}
              onStartEdit={(n) => { setEditingNotaId(n.id); setEditingNotaTexto(n.contenido); }}
              onSaveEdit={handleSaveEditNota}
              onCancelEdit={() => setEditingNotaId(null)}
              confirmDeleteNotaId={confirmDeleteNotaId}
              onRequestDelete={setConfirmDeleteNotaId}
              onConfirmDelete={handleDeleteNota}
              onCancelDelete={() => setConfirmDeleteNotaId(null)}
              isEditAllowed={isEditNotaAllowed}
            />

            </div>{/* end readOnly wrapper */}

            {/* Scrollable metadata & action footer */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top pb-3" style={{ fontSize: '0.78rem' }}>
              <div className="d-flex flex-column gap-1 text-muted" style={{ fontSize: '0.78rem' }}>
                {fullTicket?.creadorNombre && (
                  <span>
                    <i className="bi bi-person me-1" />
                    Creado por <span className="fw-semibold" style={{ color: '#64748b' }}>{fullTicket.creadorNombre}</span>
                    {fullTicket.fechaCreacion && <span className="ms-1">· {new Date(fullTicket.fechaCreacion).toLocaleString()}</span>}
                  </span>
                )}
                {!fullTicket?.creadorNombre && fullTicket?.fechaCreacion && (
                  <span><i className="bi bi-calendar2 me-1" />Creado {new Date(fullTicket.fechaCreacion).toLocaleString()}</span>
                )}
                {fullTicket?.fechaModificacion && (
                  <span><i className="bi bi-pencil me-1" />Última modificación {new Date(fullTicket.fechaModificacion).toLocaleString()}</span>
                )}
              </div>
              <div>
                {readOnly ? (
                  <button
                    className="btn btn-sm btn-warning px-3 py-1"
                    style={{ fontSize: '0.85rem', borderRadius: '6px' }}
                    onClick={onDesarchivar}
                  >
                    <i className="bi bi-archive me-1" /> Desarchivar
                  </button>
                ) : confirmDeleteTicket ? (
                  <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded border">
                    <span className="text-danger fw-bold small">¿Eliminar ticket?</span>
                    <button className="btn btn-sm btn-danger py-0 px-2" onClick={handleConfirmDeleteTicket}>Sí</button>
                    <button className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => setConfirmDeleteTicket(false)}>No</button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-outline-danger px-3 py-1" style={{ fontSize: '0.85rem', borderRadius: '6px' }} onClick={() => setConfirmDeleteTicket(true)}>
                    <i className="bi bi-trash me-1" /> Eliminar ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVincularModal && (
        <VincularTicketModal
          ticket={ticket}
          allTickets={allTickets}
          vinculos={vinculos}
          onClose={() => setShowVincularModal(false)}
          onUpdate={() => { loadDetails(ticketId); onUpdateTicket(); }}
        />
      )}
    </div>
  );
};
