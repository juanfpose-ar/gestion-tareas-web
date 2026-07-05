import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Prioridad, Ticket, Version, VersionEstado, Reunion } from '../../types';
import { etiquetaService } from '../../services/etiquetaService';
import { ticketService } from '../../services/ticketService';
import { reunionService } from '../../services/reunionService';
import { useBoardStore } from '../../stores/boardStore';
import { useUiStore } from '../../stores/uiStore';
import { Sidebar } from '../../components/layout/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketDetailModal } from './modals/TicketDetailModal';
import { TableroModal } from './modals/TableroModal';
import { TicketCreateModal } from './modals/TicketCreateModal';
import { EtiquetaModal } from './modals/EtiquetaModal';
import { UserManagementModal } from './modals/UserManagementModal';
import { DeleteColumnModal } from './modals/DeleteColumnModal';
import { VersionModal } from './modals/VersionModal';
import { ReunionModal } from './modals/ReunionModal';
import { FilterState, initialFilterState } from './components/BoardFilterDropdown';
import { BoardSummary } from './components/BoardSummary';
import { PlannerPanel } from './components/PlannerPanel';
import { ClosedVersionsPanel } from './components/ClosedVersionsPanel';
import { ArchivedTicketsPanel } from './components/ArchivedTicketsPanel';
import { BoardBottomNav } from './components/BoardBottomNav';
import { BoardNavbar } from './components/BoardNavbar';
import { BoardTable } from './components/BoardTable';
import { BoardCalendar } from './components/BoardCalendar';
import { BoardTimeline } from './components/BoardTimeline';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const {
    boards,
    activeBoardId,
    estados,
    tickets,
    etiquetas,
    versions,
    loading,
    loadBoards,
    setActiveBoardId,
    loadBoardData,
    createBoard,
    createEstado,
    updateEstado,
    deleteEstado,
    createTicket,
    updateTicketLocal,
  } = useBoardStore();

  const { activeModal, selectedTicket, initialTicketEstadoId, selectedEstadoNombre, openModal, closeModal } =
    useUiStore();

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [showCerradas, setShowCerradas] = useState(false);
  const [filterVersionEnCurso, setFilterVersionEnCurso] = useState(false);

  const [activeView, setActiveView] = useState<'board' | 'table' | 'calendar' | 'timeline' | 'summary'>('board');
  const [summaryMode, setSummaryMode] = useState<'team' | 'mine'>('team');
  const [showPlannerPanel, setShowPlannerPanel] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Modal specific states
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | undefined>(undefined);
  const [versionModalReadOnly, setVersionModalReadOnly] = useState(false);

  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [reunionModalOpen, setReunionModalOpen] = useState(false);
  const [editingReunion, setEditingReunion] = useState<Reunion | undefined>(undefined);
  const [reunionInitialDate, setReunionInitialDate] = useState<Date | undefined>(undefined);

  const handleSetView = (view: 'board' | 'table' | 'calendar' | 'timeline' | 'summary') => {
    setActiveView(view);
    setShowPlannerPanel(false);
    setShowArchived(false);
    setArchivedTickets([]);
    setShowCerradas(false);
    if (view === 'table' || view === 'calendar') {
      setFilterVersionEnCurso(false);
    }
    if (view === 'summary' && activeBoardId) {
      loadBoardData(activeBoardId).catch(() => {});
    }
  };

  useEffect(() => {
    loadBoards().catch(() => toast.error('Error cargando tableros'));
  }, [loadBoards]);

  useEffect(() => {
    if (boardId) {
      const id = Number(boardId);
      setActiveBoardId(id);
    }
  }, [boardId, setActiveBoardId]);

  useEffect(() => {
    if (activeBoardId) {
      loadBoardData(activeBoardId).catch(() =>
        toast.error('Error cargando datos del tablero')
      );
      setShowArchived(false);
      setArchivedTickets([]);
      reunionService.getByTablero(activeBoardId).then(setReuniones).catch(() => { });
    }
  }, [activeBoardId, loadBoardData]);

  const reloadReuniones = () => {
    if (activeBoardId) reunionService.getByTablero(activeBoardId).then(setReuniones).catch(() => { });
  };

  const handleSelectBoard = (id: number) => {
    navigate(`/kanban/${id}`);
  };

  const handleCreateBoard = async (nombre: string, descripcion?: string, imagenFondoUrl?: string) => {
    try {
      const newBoard = await createBoard(nombre, descripcion, imagenFondoUrl);
      navigate(`/kanban/${newBoard.id}`);
      closeModal();
      toast.success('Tablero creado');
    } catch {
      toast.error('Error creando tablero');
    }
  };

  const handleCreateEstado = async (nombre: string, colorHex: string, orden: number) => {
    if (!activeBoardId) return;
    try {
      await createEstado({ nombre, colorHex, orden, tableroId: activeBoardId });
      toast.success('Columna creada');
    } catch {
      toast.error('Error creando columna');
    }
  };

  const handleOpenDeleteEstado = (estadoId: number, estadoNombre?: string) => {
    openModal('deleteEstado', { estadoId, estadoNombre });
  };

  const handleEditColumn = async (estadoId: number, nombre: string, colorHex: string) => {
    try {
      await updateEstado(estadoId, nombre, colorHex);
    } catch {
      toast.error('No se pudo actualizar la columna');
    }
  };

  const handleConfirmDeleteEstado = async () => {
    if (!activeBoardId || !initialTicketEstadoId) return;
    try {
      await deleteEstado(initialTicketEstadoId);
      toast.success('Columna actualizada');
    } catch {
      toast.error('Error eliminando columna');
    }
  };

  const handleCreateEtiqueta = async (nombre: string, colorHex: string, esGlobal: boolean) => {
    try {
      await etiquetaService.crearEtiqueta({
        nombre,
        colorHex,
        tableroId: esGlobal ? null : activeBoardId,
      });
      if (activeBoardId) await loadBoardData(activeBoardId);
      closeModal();
      toast.success('Etiqueta creada');
    } catch {
      toast.error('Error creando etiqueta');
    }
  };

  const handleCreateTicket = async (data: {
    titulo: string;
    descripcion?: string;
    prioridad: Prioridad;
    estadoId: number;
    etiquetasIds?: number[];
  }) => {
    if (!activeBoardId) return;
    try {
      await createTicket({ ...data, tableroId: activeBoardId });
      closeModal();
      toast.success('Tarea creada');
    } catch {
      toast.error('Error creando tarea');
    }
  };

  const handleOpenAddTicket = async (estadoId: number, titulo?: string) => {
    if (titulo && activeBoardId) {
      try {
        await createTicket({
          titulo,
          prioridad: Prioridad.MEDIA,
          estadoId,
          tableroId: activeBoardId,
        });
        toast.success('Tarea creada');
      } catch {
        toast.error('Error creando tarea');
      }
    } else {
      openModal('ticket', { estadoId });
    }
  };

  const handleToggleArchived = async () => {
    if (showArchived) {
      setShowArchived(false);
      setArchivedTickets([]);
      return;
    }
    if (!activeBoardId) return;
    setArchivedLoading(true);
    try {
      const archived = await ticketService.getArchivedByTablero(activeBoardId);
      setArchivedTickets(archived);
      setShowArchived(true);
    } catch {
      toast.error('Error cargando tickets archivados');
    } finally {
      setArchivedLoading(false);
    }
  };

  const handleDesarchivar = async () => {
    if (!selectedTicket) return;
    try {
      await ticketService.desarchivarTicket(selectedTicket.id);
      toast.success('Ticket desarchivado');
      setArchivedTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));
      closeModal();
      if (activeBoardId) loadBoardData(activeBoardId);
    } catch {
      toast.error('Error al desarchivar');
    }
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  useEffect(() => {
    document.title = activeBoard ? `GT | ${activeBoard.titulo}` : 'GT | GestorTareas';
    return () => { document.title = 'GT | GestorTareas'; };
  }, [activeBoard]);

  const versionEnCurso = useMemo(() => {
    return versions.find((v) => v.estado === VersionEstado.EN_CURSO);
  }, [versions]);

  useEffect(() => {
    if (!versionEnCurso) {
      setFilterVersionEnCurso(false);
    }
  }, [versionEnCurso]);

  // Real-time dynamic filtering on the frontend
  const filteredTickets = useMemo(() => {
    let active = tickets.filter((ticket: Ticket) => {
      // 1. Keyword (title, description, and notes)
      if (filters.keyword.trim() !== '') {
        const kw = filters.keyword.toLowerCase();
        const matchesTitle = ticket.titulo.toLowerCase().includes(kw);
        const matchesDesc = ticket.descripcion?.toLowerCase().includes(kw) ?? false;
        const matchesNotes = ticket.notas?.some((n) => n.contenido.toLowerCase().includes(kw)) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesNotes) {
          return false;
        }
      }

      // 2. Members
      if (filters.sinMiembros) {
        const hasMembers = (ticket.asignados && ticket.asignados.length > 0) || ticket.asignadoId;
        if (hasMembers) return false;
      }
      if (filters.tarjetasAsignadas) {
        if (!currentUser) return false;
        const isAssigned =
          ticket.asignadoId === currentUser.id ||
          ticket.asignados?.some((u) => u.id === currentUser.id) ||
          ticket.asignadosCard?.some((u) => u.id === currentUser.id);
        if (!isAssigned) return false;
      }
      if (filters.informadoPorMi) {
        if (!currentUser) return false;
        if (!ticket.informadosIds?.includes(currentUser.id)) return false;
      }

      // 3. Tags
      if (filters.sinEtiquetas) {
        if (ticket.etiquetas && ticket.etiquetas.length > 0) return false;
      }
      if (filters.selectedEtiquetasIds.length > 0) {
        if (!ticket.etiquetas || ticket.etiquetas.length === 0) return false;
        const ticketTagIds = ticket.etiquetas.map((t) => t.id);
        const hasMatchingTag = filters.selectedEtiquetasIds.some((id) => ticketTagIds.includes(id));
        if (!hasMatchingTag) return false;
      }

      // 4. Due Date
      if (filters.sinVencimiento && ticket.fechaVencimiento) {
        return false;
      }

      // 5. Version
      if (filters.sinVersion && ticket.versionId) {
        return false;
      }
      if (filters.selectedVersionIds.length > 0) {
        if (!ticket.versionId || !filters.selectedVersionIds.includes(ticket.versionId)) {
          return false;
        }
      }

      return true;
    });

    if (filterVersionEnCurso && versionEnCurso) {
      active = active.filter((ticket) => ticket.versionId === versionEnCurso.id);
    }

    return active;
  }, [tickets, filters, filterVersionEnCurso, versionEnCurso, currentUser]);

  return (
    <div className="cpq-layout">
      <Sidebar onSelectBoard={handleSelectBoard} />

      <div className={`cpq-content ${activeBoard?.imagenFondoUrl ? 'has-board-bg' : ''}`}>
        {activeBoard?.imagenFondoUrl && (
          <>
            <div
              className="cpq-board-bg-blur"
              style={{ backgroundImage: `url(${activeBoard.imagenFondoUrl})` }}
            />
            <div className="cpq-board-bg-overlay" />
          </>
        )}
        <BoardNavbar
          boardTitle={activeBoard?.titulo}
          imagenFondoUrl={activeBoard?.imagenFondoUrl}
          activeView={activeView}
          onSetView={handleSetView}
          loading={loading}
          filters={filters}
          onChangeFilters={setFilters}
          etiquetas={etiquetas}
          versions={versions}
          filterVersionEnCurso={filterVersionEnCurso}
          onChangeFilterVersionEnCurso={setFilterVersionEnCurso}
          versionEnCurso={versionEnCurso}
          onNewVersionClick={() => { setEditingVersion(undefined); setVersionModalOpen(true); }}
          onNewMeetingClick={() => { setEditingReunion(undefined); setReunionInitialDate(calendarDate); setReunionModalOpen(true); }}
          summaryMode={summaryMode}
          onChangeSummaryMode={setSummaryMode}
          showCerradas={showCerradas}
          onToggleClosedVersions={() => setShowCerradas(!showCerradas)}
          showArchived={showArchived}
          onToggleArchivedTickets={handleToggleArchived}
          archivedLoading={archivedLoading}
          showPlannerPanel={showPlannerPanel}
          onTogglePlanner={() => setShowPlannerPanel(!showPlannerPanel)}
        />

        <div className="d-flex flex-row flex-grow-1 overflow-hidden p-3 gap-3">
          <PlannerPanel
            show={showPlannerPanel}
            onClose={() => setShowPlannerPanel(false)}
          />

          <ClosedVersionsPanel
            show={showCerradas}
            onClose={() => setShowCerradas(false)}
            versions={versions}
            tickets={tickets}
            onEditVersion={(ver) => { setEditingVersion(ver); setVersionModalOpen(true); }}
          />

          <ArchivedTicketsPanel
            show={showArchived}
            onClose={() => { setShowArchived(false); setArchivedTickets([]); }}
            tickets={archivedTickets}
            loading={archivedLoading}
            onOpenTicket={(t) => openModal('ticketDetail', { ticket: t })}
          />

          <div className="flex-grow-1 overflow-auto" style={{ paddingBottom: '96px' }}>
            {!activeBoardId ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5 bg-white rounded shadow-sm">
                <i className="bi bi-kanban fs-1 mb-2 text-primary"></i>
                <h5>Seleccioná o creá un tablero para comenzar</h5>
              </div>
            ) : activeView === 'board' ? (
              <KanbanBoard
                estados={estados}
                tickets={filteredTickets}
                onSelectTicket={(ticket) => openModal('ticketDetail', { ticket })}
                onAddTicket={handleOpenAddTicket}
                onDeleteColumn={handleOpenDeleteEstado}
                onEditColumn={handleEditColumn}
                onAddColumn={(nombre, colorHex) => handleCreateEstado(nombre, colorHex, estados.length + 1)}
                onArchiveTicket={async (ticketId) => {
                  await ticketService.archivarTicket(ticketId);
                  toast.success('Ticket archivado');
                  if (activeBoardId) loadBoardData(activeBoardId);
                }}
              />
            ) : activeView === 'table' ? (
              <BoardTable
                versions={versions}
                tickets={tickets}
                filteredTickets={filteredTickets}
                activeBoardId={activeBoardId}
                loadBoardData={loadBoardData}
                openModal={openModal}
                updateTicketLocal={updateTicketLocal}
                setEditingVersion={setEditingVersion}
                setVersionModalReadOnly={setVersionModalReadOnly}
                setVersionModalOpen={setVersionModalOpen}
              />
            ) : activeView === 'calendar' ? (
              <BoardCalendar
                versions={versions}
                tickets={tickets}
                filteredTickets={filteredTickets}
                reuniones={reuniones}
                activeBoardId={activeBoardId}
                loadBoardData={loadBoardData}
                openModal={openModal}
                reloadReuniones={reloadReuniones}
                setVersionModalReadOnly={setVersionModalReadOnly}
                setEditingVersion={setEditingVersion}
                setVersionModalOpen={setVersionModalOpen}
                setEditingReunion={setEditingReunion}
                setReunionInitialDate={setReunionInitialDate}
                setReunionModalOpen={setReunionModalOpen}
                calendarDate={calendarDate}
                setCalendarDate={setCalendarDate}
              />
            ) : activeView === 'summary' ? (
              <BoardSummary
                tickets={tickets}
                estados={estados}
                etiquetas={etiquetas}
                onOpenTicket={(ticket) => openModal('ticketDetail', { ticket })}
                mode={summaryMode}
                currentUserId={currentUser?.id}
                versionEnCurso={versionEnCurso}
              />
            ) : (
              <BoardTimeline
                filteredTickets={filteredTickets}
                openModal={openModal}
              />
            )}
          </div>
        </div>
      </div>

      {activeModal === 'tablero' && (
        <TableroModal onClose={closeModal} onSubmit={handleCreateBoard} />
      )}

      {activeModal === 'etiqueta' && (
        <EtiquetaModal onClose={closeModal} onSubmit={handleCreateEtiqueta} />
      )}

      {activeModal === 'users' && (
        <UserManagementModal
          boards={boards}
          onClose={() => {
            closeModal();
            loadBoards().catch(() => null);
          }}
        />
      )}

      {activeModal === 'ticket' && initialTicketEstadoId !== null && (
        <TicketCreateModal
          initialEstadoId={initialTicketEstadoId}
          estados={estados}
          etiquetas={etiquetas}
          onClose={closeModal}
          onSubmit={handleCreateTicket}
        />
      )}

      {activeModal === 'ticketDetail' && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          estados={estados}
          allTickets={tickets}
          onClose={closeModal}
          onUpdateTicket={async () => { if (activeBoardId) await loadBoardData(activeBoardId); }}
          readOnly={selectedTicket.archivado === true}
          onDesarchivar={handleDesarchivar}
        />
      )}

      {activeModal === 'deleteEstado' && (
        <DeleteColumnModal
          nombre={selectedEstadoNombre || 'Columna'}
          onClose={closeModal}
          onConfirm={handleConfirmDeleteEstado}
        />
      )}

      {reunionModalOpen && activeBoardId && (
        <ReunionModal
          tableroId={activeBoardId}
          tickets={tickets}
          initialDate={reunionInitialDate}
          reunion={editingReunion}
          onClose={() => { setReunionModalOpen(false); setEditingReunion(undefined); setReunionInitialDate(undefined); }}
          onSaved={() => {
            setReunionModalOpen(false);
            setEditingReunion(undefined);
            setReunionInitialDate(undefined);
            reloadReuniones();
          }}
        />
      )}

      {versionModalOpen && activeBoardId && (
        <VersionModal
          tableroId={activeBoardId}
          tickets={tickets}
          versions={versions}
          version={editingVersion}
          readOnly={versionModalReadOnly}
          onClose={() => {
            setVersionModalOpen(false);
            setEditingVersion(undefined);
            setVersionModalReadOnly(false);
          }}
          onSaved={() => {
            const wasEditing = !!editingVersion;
            setVersionModalOpen(false);
            setEditingVersion(undefined);
            setVersionModalReadOnly(false);
            loadBoardData(activeBoardId);
            toast.success(wasEditing ? 'Versión actualizada' : 'Versión creada');
          }}
        />
      )}

      <BoardBottomNav activeView={activeView} onSetView={handleSetView} />
    </div>
  );
}
