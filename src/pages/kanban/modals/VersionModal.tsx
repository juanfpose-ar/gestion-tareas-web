import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Version, VersionEstado } from '../../../types';
import { versionService, VersionRequest } from '../../../services/versionService';
import { ticketService } from '../../../services/ticketService';

interface Props {
  tableroId: number;
  tickets: Ticket[];
  versions: Version[];
  version?: Version;
  onClose: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

const ESTADO_OPTS = [
  { value: VersionEstado.POR_HACER,  label: 'Por hacer',  bg: '#ede9fe', border: '#a78bfa', text: '#6d28d9' },
  { value: VersionEstado.EN_CURSO,   label: 'En curso',   bg: '#ddd6fe', border: '#7c3aed', text: '#4c1d95' },
  { value: VersionEstado.FINALIZADO, label: 'Finalizado', bg: '#f5f3ff', border: '#c4b5fd', text: '#8b5cf6' },
  { value: VersionEstado.CERRADO,    label: 'Cerrado',    bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
] as const;

const P_COLOR: Record<string, string> = {
  ALTA: '#dc2626', MEDIA: '#d97706', BAJA: '#16a34a',
};

export const VersionModal: React.FC<Props> = ({
  tableroId, tickets, versions, version, onClose, onSaved, readOnly = false,
}) => {
  const isEdit = !!version;
  const [titulo, setTitulo] = useState(version?.titulo ?? '');
  const [fecha, setFecha] = useState(
    version?.fechaVencimiento ? version.fechaVencimiento.substring(0, 10) : ''
  );
  const [estado, setEstado] = useState<VersionEstado>(version?.estado ?? VersionEstado.POR_HACER);
  const [selectedIds, setSelectedIds] = useState<number[]>(version?.ticketIds ?? []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cerradoTickets, setCerradoTickets] = useState<Ticket[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().substring(0, 10);
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().substring(0, 10); })();

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Para versiones CERRADAS traemos todos los tickets vinculados (incluye archivados)
  useEffect(() => {
    if (version?.estado !== VersionEstado.CERRADO || !version?.id) return;
    ticketService.getByVersion(version.id).then(setCerradoTickets).catch(() => {});
  }, [version?.id]);

  // Flags derived from the currently selected estado (reactive to button clicks)
  const isCerrado    = estado === VersionEstado.CERRADO;
  const isFinalizado = estado === VersionEstado.FINALIZADO;
  const isEnCurso    = estado === VersionEstado.EN_CURSO;

  const hasOtherEnCurso = versions.some(
    v => v.estado === VersionEstado.EN_CURSO && v.id !== version?.id
  );

  // Para CERRADO usamos cerradoTickets (incluye archivados); para el resto, tickets del tablero
  const ticketLookup = (id: number) =>
    cerradoTickets.find(t => t.id === id) ?? tickets.find(t => t.id === id);

  // Completion stats over selected tickets
  const doneSelectedCount = selectedIds.filter(id => ticketLookup(id)?.completado ?? false).length;
  // Vacuously true for 0 tickets so empty versions can still transition
  const allSelectedDone = selectedIds.every(id => {
    const t = ticketLookup(id);
    return !t || t.completado;
  });

  // Quick version-estado lookup by ticket.versionId
  const versionMap = new Map(versions.map(v => [v.id, v]));
  const ticketVersionEstado = (t: Ticket): VersionEstado | null => {
    if (!t.versionId || t.versionId === version?.id) return null;
    return versionMap.get(t.versionId)?.estado ?? null;
  };

  // Ticket list shown in the modal, filtered by current estado rules
  let activeTickets: Ticket[];
  if (readOnly || isCerrado) {
    // CERRADO: usa la lista completa traída del backend (incluye archivados)
    // fallback a tickets del tablero mientras carga o para readOnly de otras versiones
    activeTickets = cerradoTickets.length > 0
      ? cerradoTickets
      : tickets.filter(t => version?.ticketIds?.includes(t.id));
  } else if (isFinalizado) {
    // Already linked + completed tickets with no version
    activeTickets = tickets.filter(t => {
      if (t.archivado) return false;
      if (version?.ticketIds?.includes(t.id)) return true;
      return t.completado && !t.versionId;
    });
  } else if (isEnCurso) {
    // Already linked + no version + in a POR_HACER version
    activeTickets = tickets.filter(t => {
      if (t.archivado) return false;
      if (version?.ticketIds?.includes(t.id)) return true;
      if (!t.versionId) return true;
      return ticketVersionEstado(t) === VersionEstado.POR_HACER;
    });
  } else if (!isEdit) {
    // Nueva versión: tickets sin versión, en POR_HACER o en EN_CURSO
    activeTickets = tickets.filter(t => {
      if (t.archivado) return false;
      if (!t.versionId) return true;
      const vs = ticketVersionEstado(t);
      return vs === VersionEstado.POR_HACER || vs === VersionEstado.EN_CURSO;
    });
  } else {
    // Editando POR_HACER: ya vinculados + sin versión + en versión EN_CURSO
    activeTickets = tickets.filter(t => {
      if (t.archivado) return false;
      if (version?.ticketIds?.includes(t.id)) return true;
      if (!t.versionId) return true;
      return ticketVersionEstado(t) === VersionEstado.EN_CURSO;
    });
  }

  const filteredTickets = search.trim()
    ? activeTickets.filter(t =>
        t.titulo.toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search)
      )
    : activeTickets;

  const canToggle = !readOnly && !isCerrado;

  const toggle = (id: number) => {
    if (!canToggle) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ─── Estado button rules ─────────────────────────────────────────────────────
  // Matrix: rows = current estado, cols = target option
  //
  // CERRADO    → POR_HACER ✓ | EN_CURSO ✓ (if no other) | FINALIZADO ✓ | CERRADO ✓ (current)
  // FINALIZADO → POR_HACER ✓ | EN_CURSO ✓ (if no other) | FINALIZADO ✓ (current) | CERRADO ✓ (if all done)
  // EN_CURSO   → POR_HACER ✓ | EN_CURSO ✓ (current) | FINALIZADO ✓ (if all done) | CERRADO ✗
  // POR_HACER  → POR_HACER ✓ (current) | EN_CURSO ✓ (if no other) | FINALIZADO ✗ | CERRADO ✗

  const isEstadoDisabled = (opt: VersionEstado): boolean => {
    if (readOnly) return true;
    switch (estado) {
      case VersionEstado.CERRADO:
        if (opt === VersionEstado.EN_CURSO) return hasOtherEnCurso;
        if (opt === VersionEstado.POR_HACER) return true;
        return false;
      case VersionEstado.FINALIZADO:
        if (opt === VersionEstado.CERRADO) return !allSelectedDone;
        if (opt === VersionEstado.EN_CURSO) return hasOtherEnCurso;
        if (opt === VersionEstado.POR_HACER) return true;
        return false;
      case VersionEstado.EN_CURSO:
        if (opt === VersionEstado.FINALIZADO) return !allSelectedDone;
        if (opt === VersionEstado.CERRADO) return true;
        return false;
      case VersionEstado.POR_HACER:
        if (opt === VersionEstado.EN_CURSO) return hasOtherEnCurso;
        if (opt === VersionEstado.FINALIZADO || opt === VersionEstado.CERRADO) return true;
        return false;
      default:
        return false;
    }
  };

  const getEstadoTooltip = (opt: VersionEstado): string | undefined => {
    if (!isEstadoDisabled(opt) || readOnly) return undefined;
    switch (estado) {
      case VersionEstado.CERRADO:
        if (opt === VersionEstado.EN_CURSO) return 'Ya hay una versión en curso';
        if (opt === VersionEstado.POR_HACER) return 'No disponible desde Cerrado';
        break;
      case VersionEstado.FINALIZADO:
        if (opt === VersionEstado.CERRADO) return 'Completá todos los tickets para cerrar';
        if (opt === VersionEstado.EN_CURSO) return 'Ya hay una versión en curso';
        if (opt === VersionEstado.POR_HACER) return 'No disponible desde Finalizado';
        break;
      case VersionEstado.EN_CURSO:
        if (opt === VersionEstado.FINALIZADO) return 'Completá todos los tickets para finalizar';
        if (opt === VersionEstado.CERRADO) return 'No disponible desde En curso';
        break;
      case VersionEstado.POR_HACER:
        if (opt === VersionEstado.EN_CURSO) return 'Ya hay una versión en curso';
        if (opt === VersionEstado.FINALIZADO || opt === VersionEstado.CERRADO) return 'No disponible desde Por hacer';
        break;
    }
    return undefined;
  };

  // Show a lock icon only when blocked by ticket completion (not by other reasons)
  const showLock = (opt: VersionEstado): boolean =>
    isEstadoDisabled(opt) && (
      (isFinalizado && opt === VersionEstado.CERRADO && !allSelectedDone) ||
      (isEnCurso    && opt === VersionEstado.FINALIZADO && !allSelectedDone)
    );

  const showProgress = (isFinalizado || isEnCurso) && selectedIds.length > 0;

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isCerrado) {
      if (!titulo.trim()) { setError('El título es obligatorio.'); return; }
      if (!fecha)          { setError('La fecha de vencimiento es obligatoria.'); return; }
      const minFecha = isEdit ? today : tomorrow;
      if (fecha < minFecha) { setError(isEdit ? 'La fecha no puede ser anterior a hoy.' : 'La fecha debe ser posterior al día de hoy.'); return; }
    }
    if (estado === VersionEstado.EN_CURSO && hasOtherEnCurso) {
      setError('Ya existe una versión "En curso" en este tablero. Solo puede haber una.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const req: VersionRequest = {
        titulo: titulo.trim(),
        fechaVencimiento: fecha,
        tableroId,
        ticketIds: selectedIds,
        estado,
      };
      if (isEdit && version) {
        await versionService.actualizarVersion(version.id, req);
      } else {
        await versionService.crearVersion(req);
      }
      onSaved();
    } catch {
      setError('Error al guardar la versión.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 520 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-tag-fill" style={{ color: '#7c3aed' }} />
              {readOnly ? 'Detalle de la Versión' : isEdit ? 'Editar Versión' : 'Nueva Versión'}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body px-4 py-3">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            {!readOnly && isCerrado && (
              <div className="alert alert-secondary py-2 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-lock-fill" />
                <span>Versión cerrada. Solo podés cambiar el estado.</span>
              </div>
            )}

            {/* Título */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Título</label>
              <input
                className="form-control"
                placeholder="Ej: v1.0.0, Sprint 3..."
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                disabled={readOnly || isCerrado}
              />
            </div>

            {/* Fecha */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Fecha de vencimiento</label>
              <input
                type="date"
                className="form-control"
                value={fecha}
                min={isEdit ? today : tomorrow}
                onChange={e => setFecha(e.target.value)}
                disabled={readOnly || isCerrado}
              />
            </div>

            {/* Estado (solo en edición) */}
            {isEdit && (
              <div className="mb-3">
                <label className="form-label fw-semibold small">Estado</label>
                <div className="d-flex gap-2 flex-wrap">
                  {ESTADO_OPTS.map(opt => {
                    const disabled  = isEstadoDisabled(opt.value);
                    const isSelected = estado === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => !disabled && setEstado(opt.value)}
                        title={getEstadoTooltip(opt.value)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          border: `2px solid ${isSelected ? opt.border : '#e2e8f0'}`,
                          backgroundColor: isSelected ? opt.bg : 'transparent',
                          color: isSelected ? opt.text : '#64748b',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.82rem',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.12s',
                          opacity: disabled && !isSelected ? 0.38 : 1,
                        }}
                      >
                        {opt.label}
                        {showLock(opt.value) && (
                          <i className="bi bi-lock ms-1" style={{ fontSize: '0.7rem' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progreso tickets completados (FINALIZADO y EN_CURSO) */}
                {showProgress && (
                  <div className="mt-1" style={{ fontSize: '0.75rem' }}>
                    {allSelectedDone
                      ? <span className="text-success">
                          <i className="bi bi-check-circle me-1" />
                          Todos los tickets completados.
                        </span>
                      : <span className="text-muted">
                          {doneSelectedCount}/{selectedIds.length} tickets completados.
                        </span>
                    }
                  </div>
                )}
              </div>
            )}

            {/* Tickets */}
            <div className="mb-1">
              <label className="form-label fw-semibold small d-flex align-items-center justify-content-between">
                <span>Tickets vinculados</span>
                <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.78rem' }}>
                  {selectedIds.length} seleccionados
                </span>
              </label>
              <input
                ref={searchRef}
                className="form-control form-control-sm mb-2"
                placeholder="Buscar ticket..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={!canToggle && filteredTickets.length === 0}
              />
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '4px 0',
                  opacity: isCerrado ? 0.6 : 1,
                }}
              >
                {filteredTickets.length === 0 ? (
                  <p className="text-muted text-center small py-3 mb-0">
                    {isFinalizado ? 'No hay tickets completados disponibles.' : 'Sin resultados.'}
                  </p>
                ) : (
                  filteredTickets.map(t => {
                    const checked = selectedIds.includes(t.id);
                    const done    = t.completado;
                    return (
                      <label
                        key={t.id}
                        className={`d-flex align-items-center gap-2 px-3 py-2 ${checked ? 'bg-light' : ''}`}
                        style={{ cursor: canToggle ? 'pointer' : 'default', margin: 0, transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (canToggle && !checked) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={e => { if (canToggle && !checked) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-0 flex-shrink-0"
                          checked={checked}
                          onChange={() => toggle(t.id)}
                          onClick={e => e.stopPropagation()}
                          disabled={!canToggle}
                        />
                        <span className="badge bg-secondary" style={{ fontSize: '0.7rem', minWidth: 30 }}>
                          #{t.id}
                        </span>
                        <span
                          className="flex-grow-1 text-truncate"
                          style={{ fontSize: '0.85rem', maxWidth: 260 }}
                          title={t.titulo}
                        >
                          {t.titulo}
                        </span>
                        {isFinalizado && (
                          <i
                            className={`bi ${done ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`}
                            style={{ fontSize: '0.8rem', flexShrink: 0 }}
                            title={done ? 'Completado' : 'Pendiente'}
                          />
                        )}
                        <span style={{ color: P_COLOR[t.prioridad] ?? '#64748b', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>
                          {t.prioridad}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
            {readOnly ? (
              <button className="btn btn-secondary px-4 fw-semibold" style={{ borderRadius: 8 }} onClick={onClose}>
                Cerrar
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button className="btn btn-primary fw-semibold" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <span className="spinner-border spinner-border-sm me-1" />
                    : <i className="bi bi-check-lg me-1" />}
                  {isEdit ? 'Guardar cambios' : 'Crear versión'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
