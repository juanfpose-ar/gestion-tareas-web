import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassNavbar } from '../../components/layout/GlassNavbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMensajeriaStore } from '../../stores/mensajeriaStore';
import { userService } from '../../services/userService';
import { mensajeriaService } from '../../services/mensajeriaService';
import { getContrastColor } from '../../utils/colorUtils';
import type { ConversacionResumen, ConversacionDetalle, Usuario } from '../../types';

export function BandejaPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  // Core Data States
  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [selectedThreadDetail, setSelectedThreadDetail] = useState<ConversacionDetalle | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Folder and Search Filter States
  const [activeFolder, setActiveFolder] = useState<'conversaciones' | 'archivados'>('conversaciones');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply Form States
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Compose Modal States
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState<number[]>([]);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);

  // User Autocomplete States (for USER role)
  const [recipientSearchText, setRecipientSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Usuario[]>([]);

  // Selected conversations for bulk actions
  const [selectedConversacionIds, setSelectedConversacionIds] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the inbox summary
  const fetchBandeja = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const data = await mensajeriaService.getBandeja();
      setConversaciones(data);
      useMensajeriaStore.getState().setUnreadFromConversaciones(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch all users for composing list
  useEffect(() => {
    document.title = 'GT | Bandeja';
    fetchBandeja();

    // Fetch users once
    userService.getUsuarios().then(setUsers).catch(console.error);

    // Set polling interval: 60 seconds
    const interval = setInterval(() => {
      fetchBandeja();
    }, 60000);

    return () => {
      document.title = 'GT | GestorTareas';
      clearInterval(interval);
    };
  }, [fetchBandeja]);

  // Scroll to bottom when a conversation detail loads or updates
  useEffect(() => {
    if (selectedThreadDetail) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThreadDetail]);

  // Folder count badges
  const unreadConversacionesCount = conversaciones.filter(c => !c.archivada && c.tieneNoLeidos).length;
  const unreadArchivedCount = conversaciones.filter(c => c.archivada && c.tieneNoLeidos).length;

  // Thread detail retriever
  const selectThread = async (id: number) => {
    setSelectedThreadId(id);
    setSelectedThreadDetail(null);
    try {
      const detail = await mensajeriaService.getConversacion(id);
      setSelectedThreadDetail(detail);

      // Locally mark as read
      setConversaciones(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, tieneNoLeidos: false } : c);
        useMensajeriaStore.getState().setUnreadFromConversaciones(updated);
        return updated;
      });
    } catch (err) {
      console.error('Error fetching conversation detail:', err);
    }
  };

  // Reply handler
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const updatedDetail = await mensajeriaService.responderConversacion(selectedThreadId, {
        contenido: replyText.trim()
      });
      setSelectedThreadDetail(updatedDetail);
      setReplyText('');

      // Update main conversations list
      fetchBandeja();
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Archive / Unarchive Handler
  const handleToggleArchive = async (id: number, currentArchivedState: boolean) => {
    try {
      await mensajeriaService.actualizarEstado(id, { archivada: !currentArchivedState });
      if (selectedThreadId === id) {
        setSelectedThreadId(null);
        setSelectedThreadDetail(null);
      }
      fetchBandeja();
    } catch (err) {
      console.error('Error modifying archive status:', err);
    }
  };

  // Delete Handler
  const handleDeleteThread = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta conversación?')) return;
    try {
      await mensajeriaService.actualizarEstado(id, { eliminada: true });
      if (selectedThreadId === id) {
        setSelectedThreadId(null);
        setSelectedThreadDetail(null);
      }
      fetchBandeja();
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  const resetComposeState = () => {
    setShowCompose(false);
    setComposeTo([]);
    setComposeSubject('');
    setComposeBody('');
    setRecipientSearchText('');
    setSuggestions([]);
  };

  // Bulk selection and action handlers
  const handleToggleSelectConversation = (id: number) => {
    setSelectedConversacionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredConversaciones.map(c => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedConversacionIds.includes(id));
    
    if (allSelected) {
      // Unselect all visible
      setSelectedConversacionIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedConversacionIds(prev => {
        const unique = new Set([...prev, ...visibleIds]);
        return Array.from(unique);
      });
    }
  };

  const handleBulkArchive = async () => {
    if (selectedConversacionIds.length === 0) return;
    try {
      const targetArchivedState = activeFolder !== 'archivados';
      await Promise.all(
        selectedConversacionIds.map(id => mensajeriaService.actualizarEstado(id, { archivada: targetArchivedState }))
      );
      setSelectedConversacionIds([]);
      fetchBandeja();
    } catch (err) {
      console.error('Error bulk archiving:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConversacionIds.length === 0) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar las ${selectedConversacionIds.length} conversaciones seleccionadas?`)) return;
    try {
      await Promise.all(
        selectedConversacionIds.map(id => mensajeriaService.actualizarEstado(id, { eliminada: true }))
      );
      setSelectedConversacionIds([]);
      fetchBandeja();
    } catch (err) {
      console.error('Error bulk deleting:', err);
    }
  };

  // Compose Message Submit
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (composeTo.length === 0 || !composeSubject.trim() || !composeBody.trim()) {
      alert('Por favor complete todos los campos y seleccione al menos un destinatario.');
      return;
    }

    setSendingCompose(true);
    try {
      await mensajeriaService.crearConversacion({
        asunto: composeSubject.trim(),
        contenido: composeBody.trim(),
        destinatarioIds: composeTo
      });
      resetComposeState();
      fetchBandeja();
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Error al enviar la conversación.');
    } finally {
      setSendingCompose(false);
    }
  };

  // Recipient check box toggler
  const handleToggleRecipient = (userId: number) => {
    setComposeTo(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Autocomplete change handler (for USER role)
  const handleRecipientSearchChange = (value: string) => {
    setRecipientSearchText(value);
    
    // Find current query (the text after the last comma)
    const segments = value.split(',');
    const currentQuery = segments[segments.length - 1].trim().toLowerCase();
    
    if (currentQuery.length >= 1) {
      const filtered = users.filter(u => 
        u.id !== currentUser?.id && 
        u.activo && 
        (u.username.toLowerCase().includes(currentQuery) || 
         (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(currentQuery)))
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Suggestion selector (for USER role)
  const handleSelectSuggestion = (u: Usuario) => {
    const segments = recipientSearchText.split(',');
    // Replace the last segment with selected username
    segments[segments.length - 1] = u.username;
    // Join with commas and add a trailing comma and space
    const updatedText = segments.join(', ').trim() + ', ';
    setRecipientSearchText(updatedText);
    setSuggestions([]);
  };

  // Synchronize comma-separated usernames with composeTo recipient IDs
  useEffect(() => {
    if (currentUser?.rol !== 'ADMIN') {
      const usernames = recipientSearchText.split(',').map(s => s.trim()).filter(Boolean);
      const matchedIds = users.filter(usr => usernames.includes(usr.username)).map(usr => usr.id);
      
      const hasChanged = matchedIds.length !== composeTo.length || 
                         !matchedIds.every((id, idx) => id === composeTo[idx]);
      if (hasChanged) {
        setComposeTo(matchedIds);
      }
    }
  }, [recipientSearchText, users, currentUser, composeTo]);

  // Date/Time helper formatter (Gmail-style)
  const formatMailDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  // Filter local list of conversations
  const filteredConversaciones = conversaciones.filter(c => {
    // 1. Filter by active Folder
    if (activeFolder === 'conversaciones') {
      if (c.archivada) return false;
    } else if (activeFolder === 'archivados') {
      if (!c.archivada) return false;
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchSubject = c.asunto.toLowerCase().includes(query);
      const matchSender = c.ultimoEmisorNombre?.toLowerCase().includes(query);
      const matchSnippet = c.fragmentoUltimoMensaje?.toLowerCase().includes(query);
      return matchSubject || matchSender || matchSnippet;
    }

    return true;
  });

  return (
    <div className="cpq-layout">
      {/* Standard App Sidebar */}
      <Sidebar onSelectBoard={(id) => navigate(`/kanban/${id}`)} />

      {/* Main Container */}
      <div className="cpq-content">
        {/* Sub-navbar */}
        <GlassNavbar
          left={
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--cpq-text-title)', fontSize: '1.35rem' }}>
              <i className="bi bi-envelope-fill" style={{ color: '#3b82f6' }}></i>
              Bandeja de Entrada
            </h4>
          }
        >
          {/* Search Input */}
          <div className="position-relative" style={{ width: '380px' }}>
            <input
              type="text"
              className="form-control form-control-sm mail-search-input ps-5"
              placeholder="Buscar en el correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"></i>
            {searchQuery && (
              <button
                className="btn btn-link btn-sm position-absolute top-50 end-0 translate-middle-y text-muted me-1 p-0"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            className="btn cpq-navbar-btn"
            onClick={() => fetchBandeja(true)}
            title="Actualizar bandeja de entrada"
            disabled={refreshing}
            type="button"
          >
            <i className={`bi bi-arrow-clockwise fs-5 ${refreshing ? 'spin' : ''}`}></i>
            <span>Refrescar</span>
          </button>
        </GlassNavbar>

        {/* Mail Area split in Sub-Sidebar and Content */}
        <div className="mail-container flex-grow-1 mx-3 mt-3 mb-3">
          {/* Sub-Sidebar */}
          <div className="mail-sidebar">
            <div className="pe-3">
              <button
                onClick={() => setShowCompose(true)}
                className="btn mail-compose-btn w-100 d-flex align-items-center justify-content-start gap-3"
                type="button"
              >
                <i className="bi bi-pencil-square fs-5"></i> Redactar
              </button>
            </div>

            <div className="d-flex flex-column gap-1">
              <button
                className={`mail-nav-item border-0 text-start bg-transparent ${activeFolder === 'conversaciones' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFolder('conversaciones');
                  setSelectedThreadId(null);
                  setSelectedThreadDetail(null);
                  setSelectedConversacionIds([]);
                }}
                type="button"
              >
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text-fill"></i> Conversaciones
                </span>
                {unreadConversacionesCount > 0 && (
                  <span className="mail-nav-badge">{unreadConversacionesCount}</span>
                )}
              </button>

              <button
                className={`mail-nav-item border-0 text-start bg-transparent ${activeFolder === 'archivados' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFolder('archivados');
                  setSelectedThreadId(null);
                  setSelectedThreadDetail(null);
                  setSelectedConversacionIds([]);
                }}
                type="button"
              >
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-archive-fill"></i> Archivados
                </span>
                {unreadArchivedCount > 0 && (
                  <span className="mail-nav-badge">{unreadArchivedCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Central content */}
          <div className="mail-content">
            {loading ? (
              <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-muted">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <span>Cargando mensajes...</span>
              </div>
            ) : selectedThreadId ? (
              /* DETAIL VIEW SCREEN */
              <div className="mail-detail">
                {/* Detail Header / Actions bar */}
                <div className="mail-detail-header">
                  <button
                    className="btn cpq-navbar-btn cpq-navbar-btn-plain"
                    onClick={() => {
                      setSelectedThreadId(null);
                      setSelectedThreadDetail(null);
                    }}
                    type="button"
                  >
                    <i className="bi bi-arrow-left fs-5"></i> Volver
                  </button>

                  <div className="vr mx-1"></div>

                  {selectedThreadDetail && (
                    <>
                      {/* Archive Button */}
                      <button
                        className="btn cpq-navbar-btn cpq-navbar-btn-plain"
                        onClick={() => {
                          const item = conversaciones.find(c => c.id === selectedThreadId);
                          if (item) handleToggleArchive(selectedThreadId, item.archivada);
                        }}
                        type="button"
                        title={
                          conversaciones.find(c => c.id === selectedThreadId)?.archivada
                            ? 'Mover a Recibidos'
                            : 'Archivar'
                        }
                      >
                        <i className={`fs-5 ${
                          conversaciones.find(c => c.id === selectedThreadId)?.archivada
                            ? 'bi bi-inbox'
                            : 'bi bi-archive'
                        }`}></i>
                        <span>
                          {conversaciones.find(c => c.id === selectedThreadId)?.archivada
                            ? 'Mover a Recibidos'
                            : 'Archivar'}
                        </span>
                      </button>

                      {/* Delete Button */}
                      <button
                        className="btn cpq-navbar-btn cpq-navbar-btn-plain"
                        onClick={() => handleDeleteThread(selectedThreadId)}
                        type="button"
                        title="Eliminar conversación"
                      >
                        <i className="bi bi-trash fs-5"></i>
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Messages scroll content */}
                {!selectedThreadDetail ? (
                  <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
                    <div className="spinner-border spinner-border-sm text-secondary me-2"></div>
                    <span>Cargando conversación...</span>
                  </div>
                ) : (
                  <>
                    <div className="mail-detail-subject-header">
                      <h4 className="mail-detail-subject text-start mb-0">{selectedThreadDetail.asunto}</h4>
                      <div className="d-flex align-items-center">
                        {selectedThreadDetail.participanteIds.map((pid, idx) => {
                          const u = users.find((usr) => usr.id === pid);
                          if (!u) return null;
                          const color = u.colorAvatar ?? '#0d6efd';
                          const label = u.nombreCompleto || u.username;
                          return (
                            <div
                              key={pid}
                              className="mail-item-avatar flex-shrink-0"
                              style={{
                                backgroundColor: color,
                                color: getContrastColor(color),
                                marginLeft: idx === 0 ? 0 : '-8px',
                                border: '2px solid var(--cpq-card-bg)',
                              }}
                              title={label}
                            >
                              {label.substring(0, 1).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mail-detail-messages">
                      {selectedThreadDetail.mensajes.map((msg) => {
                        const isMine = msg.emisorId === currentUser?.id;
                        const dateSpan = <span className="small text-muted flex-shrink-0">{formatMailDate(msg.fechaEnvio)}</span>;
                        const contentSpan = <span className="mail-message-content text-start">{msg.contenido}</span>;
                        return (
                          <div key={msg.id} className="mail-message-card">
                            <div className={`mail-message-row ${isMine ? 'mail-message-mine' : ''}`}>
                              <div className="mail-message-meta">
                                <div
                                  className="mail-item-avatar flex-shrink-0"
                                  style={{ backgroundColor: isMine ? 'var(--cpq-primary)' : 'var(--cpq-accent-pink)' }}
                                >
                                  {msg.emisorNombre.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="fw-semibold text-dark">{msg.emisorNombre}</span>
                              </div>

                              <div className={`mail-message-bubble ${isMine ? 'mail-message-mine-bubble' : 'mail-message-theirs-bubble'}`}>
                                {isMine ? (
                                  <>{dateSpan}{contentSpan}</>
                                ) : (
                                  <>{contentSpan}{dateSpan}</>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Reply Box */}
                    <div className="mail-reply-box text-start">
                      <form onSubmit={handleSendReply}>
                        <div className="mb-2">
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Escribe una respuesta rápida..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                            disabled={submittingReply}
                          />
                        </div>
                        <div className="text-end">
                          <button
                            type="submit"
                            className="btn mail-compose-btn"
                            disabled={submittingReply || !replyText.trim()}
                          >
                            {submittingReply ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className="bi bi-send fs-5"></i>
                            )}
                            Enviar respuesta
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* LIST VIEW SCREEN WITH BATCH ACTIONS HEADER */
              <div className="d-flex flex-column h-100">
                {/* List Header Actions */}
                <div className="mail-list-header d-flex align-items-center justify-content-between p-2 flex-shrink-0">
                  <div className="d-flex align-items-center gap-3">
                    {/* Master Checkbox */}
                    <div className="form-check m-0 ms-2">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={filteredConversaciones.length > 0 && filteredConversaciones.every(c => selectedConversacionIds.includes(c.id))}
                        onChange={handleToggleSelectAll}
                        title="Seleccionar todo"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    
                    {/* Bulk action buttons */}
                    {selectedConversacionIds.length > 0 && (
                      <div className="d-flex align-items-center gap-1">
                        <button
                          className="mail-toolbar-btn"
                          onClick={handleBulkArchive}
                          title={activeFolder === 'archivados' ? 'Desarchivar seleccionados' : 'Archivar seleccionados'}
                        >
                          <i className="bi bi-archive"></i>
                        </button>
                        <button
                          className="mail-toolbar-btn"
                          onClick={handleBulkDelete}
                          title="Eliminar seleccionados"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        <span className="text-muted small ms-1">{selectedConversacionIds.length} seleccionada(s)</span>
                      </div>
                    )}
                  </div>

                  <span className="text-muted small me-2">
                    {filteredConversaciones.length} {filteredConversaciones.length === 1 ? 'conversación' : 'conversaciones'}
                  </span>
                </div>

                <div className="flex-grow-1 overflow-auto">
                  {filteredConversaciones.length === 0 ? (
                    /* EMPTY FOLDER SCREEN */
                    <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-muted p-4">
                      <i className="bi bi-envelope-open fs-1 mb-3 opacity-50 text-secondary"></i>
                      <h5 className="fw-semibold">No hay conversaciones</h5>
                      <p className="small text-center text-muted" style={{ maxWidth: 320 }}>
                        {activeFolder === 'conversaciones' && 'Tu bandeja de conversaciones está limpia.'}
                        {activeFolder === 'archivados' && 'No tienes conversaciones archivadas.'}
                      </p>
                    </div>
                  ) : (
                    /* LIST OF CONVERSATIONS SCREEN */
                    <div className="mail-list-container">
                      {filteredConversaciones.map((c) => {
                        return (
                          <div
                            key={c.id}
                            className={`mail-item ${c.tieneNoLeidos ? 'unread' : ''}`}
                            onClick={() => selectThread(c.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Checkbox */}
                            <div className="form-check me-2 ms-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                checked={selectedConversacionIds.includes(c.id)}
                                onChange={() => handleToggleSelectConversation(c.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>

                            {/* Participants Name */}
                            <div className="mail-item-sender text-start text-truncate me-3 ms-2" title={c.nombresParticipantes} style={{ width: '180px' }}>
                              {c.nombresParticipantes}
                            </div>

                            {/* Content details */}
                            <div className="mail-item-body text-start">
                              <span className="mail-item-subject text-dark me-2">
                                {c.asunto}
                              </span>
                              <span className="mail-item-snippet text-muted">
                                - {c.fragmentoUltimoMensaje}
                              </span>
                            </div>

                            {/* Date / quick actions (swap on hover) */}
                            <div className="mail-item-date-actions">
                              <span className="mail-item-date">
                                {formatMailDate(c.fechaUltimaActividad)}
                              </span>
                              <div className="mail-item-actions">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleArchive(c.id, c.archivada); }}
                                  title={c.archivada ? 'Mover a Recibidos' : 'Archivar'}
                                  type="button"
                                >
                                  <i className={`bi ${c.archivada ? 'bi-inbox' : 'bi-archive'}`}></i>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteThread(c.id); }}
                                  title="Eliminar"
                                  type="button"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gmail-style Compose Popup */}
      {showCompose && (
        <div className="mail-compose-popup shadow-lg border rounded-top">
          <div className="mail-compose-header">
            <span className="fw-semibold small">Nueva Conversación</span>
            <button
              className="btn btn-link btn-sm p-0 text-white border-0"
              onClick={resetComposeState}
              type="button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleCreateConversation} className="d-flex flex-column flex-grow-1">
            <div className="mail-compose-body">
              {/* Recipient Multiple Select */}
              <div className="mb-2">
                <label className="form-label small fw-semibold text-muted mb-1 text-start d-block">Destinatarios:</label>
                {currentUser?.rol === 'ADMIN' ? (
                  /* Admin view: Checkbox list of all active users */
                  <div 
                    className="border rounded p-2 overflow-auto" 
                    style={{ maxHeight: '100px', backgroundColor: '#f8fafc' }}
                  >
                    {users
                      .filter(u => u.id !== currentUser?.id && u.activo)
                      .map(u => (
                        <div key={u.id} className="form-check text-start">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`user-check-${u.id}`}
                            checked={composeTo.includes(u.id)}
                            onChange={() => handleToggleRecipient(u.id)}
                          />
                          <label className="form-check-label small" htmlFor={`user-check-${u.id}`}>
                            {u.nombreCompleto} ({u.username})
                          </label>
                        </div>
                      ))}
                  </div>
                ) : (
                  /* User view: Gmail-style autocomplete text input */
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Escribe nombres de usuario separados por coma..."
                      value={recipientSearchText}
                      onChange={(e) => handleRecipientSearchChange(e.target.value)}
                    />
                    {suggestions.length > 0 && (
                      <ul className="list-group position-absolute start-0 w-100 shadow-sm overflow-auto" 
                          style={{ zIndex: 1100, maxHeight: '150px', top: '100%', left: 0 }}>
                        {suggestions.map(u => (
                          <li 
                            key={u.id} 
                            className="list-group-item list-group-item-action text-start p-2 small"
                            onClick={() => handleSelectSuggestion(u)}
                            style={{ cursor: 'pointer' }}
                          >
                            <strong>{u.nombreCompleto || u.username}</strong> <span className="text-muted">({u.username})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {composeTo.length > 0 && (
                  <span className="text-muted small mt-1 d-block text-start">
                    Destinatarios seleccionados: {composeTo.length}
                  </span>
                )}
              </div>

              {/* Subject */}
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Asunto"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  required
                />
              </div>

              {/* Body */}
              <div className="mb-2 flex-grow-1">
                <textarea
                  className="form-control form-control-sm h-100"
                  rows={6}
                  placeholder="Escribe el cuerpo del mensaje..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  required
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            <div className="mail-compose-footer">
              <button
                type="submit"
                className="btn btn-sm btn-primary px-4"
                style={{ backgroundColor: 'var(--cpq-primary)', border: 'none' }}
                disabled={sendingCompose || composeTo.length === 0}
              >
                {sendingCompose ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-send me-1"></i>
                )}
                Enviar
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={resetComposeState}
              >
                Descartar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
