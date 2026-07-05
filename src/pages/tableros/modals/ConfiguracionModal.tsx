import { useState, useEffect, useCallback } from 'react';
import type { Tablero, Usuario, Etiqueta } from '../../../types';
import { tableroService } from '../../../services/tableroService';
import { userService } from '../../../services/userService';
import { etiquetaService } from '../../../services/etiquetaService';
import { useBoardStore } from '../../../stores/boardStore';
import { useAuthStore } from '../../../stores/authStore';
import { Rol } from '../../../types';
import { EtiquetaCrearPanel } from '../../../components/EtiquetaCrearPanel';
import { getContrastColor } from '../../../utils/colorUtils';

type Tab = 'usuarios' | 'etiquetas' | 'archivar' | 'eliminar';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

const TAB_META: { key: Tab; label: string; icon: string }[] = [
  { key: 'usuarios',  label: 'Usuarios',          icon: 'bi-people-fill' },
  { key: 'etiquetas', label: 'Etiquetas Globales', icon: 'bi-tags-fill' },
  { key: 'archivar',  label: 'Archivar',           icon: 'bi-archive-fill' },
  { key: 'eliminar',  label: 'Eliminar',           icon: 'bi-trash-fill' },
];

export function ConfiguracionModal({ onClose, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('usuarios');

  /* ── Datos cargados ── */
  const [todos, setTodos] = useState<Tablero[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [globales, setGlobales] = useState<Etiqueta[]>([]);
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Pendientes por pestaña ── */
  const [pendingUsers, setPendingUsers]         = useState<Map<number, number[]>>(new Map());
  const [tagsToAdd, setTagsToAdd]               = useState<{ nombre: string; colorHex: string; colorTexto: string }[]>([]);
  const [showCrearEtq, setShowCrearEtq]         = useState(false);
  const [tagIdsToDelete, setTagIdsToDelete]     = useState<Set<number>>(new Set());
  const [archiveChanges, setArchiveChanges]     = useState<Map<number, boolean>>(new Map()); // id → nuevo archivado
  const [toDelete, setToDelete]                 = useState<Set<number>>(new Set());

  /* ── Confirm guardar (todas las pestañas) ── */
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── Form etiqueta ── */

  const { activeBoardId, loadBoardData } = useBoardStore();
  const { user: currentUser } = useAuthStore();

  /* ── Dirty por pestaña ── */
  const dirtyCount: Record<Tab, number> = {
    usuarios:  pendingUsers.size,
    etiquetas: tagsToAdd.length + tagIdsToDelete.size,
    archivar:  archiveChanges.size,
    eliminar:  toDelete.size,
  };
  const isDirty = dirtyCount[tab] > 0;

  /* ── Cargas ── */
  const loadTableros = useCallback(async () => {
    setLoadingTabs(p => ({ ...p, tableros: true }));
    setErrors(p => ({ ...p, tableros: '' }));
    try {
      setTodos(await tableroService.getTodosTableros());
    } catch {
      setErrors(p => ({ ...p, tableros: 'No se pudieron cargar los tableros. ¿Tenés rol Admin?' }));
    } finally {
      setLoadingTabs(p => ({ ...p, tableros: false }));
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    setLoadingTabs(p => ({ ...p, usuarios: true }));
    setErrors(p => ({ ...p, usuarios: '' }));
    try {
      setUsuarios(await userService.getUsuarios());
    } catch {
      setErrors(p => ({ ...p, usuarios: 'No se pudieron cargar los usuarios. ¿Tenés rol Admin?' }));
    } finally {
      setLoadingTabs(p => ({ ...p, usuarios: false }));
    }
  }, []);

  const loadGlobales = useCallback(async () => {
    setLoadingTabs(p => ({ ...p, etiquetas: true }));
    try {
      setGlobales(await etiquetaService.getGlobales());
    } catch {
      setErrors(p => ({ ...p, etiquetas: 'No se pudieron cargar las etiquetas.' }));
    } finally {
      setLoadingTabs(p => ({ ...p, etiquetas: false }));
    }
  }, []);

  useEffect(() => {
    loadTableros();
    loadUsuarios();
    loadGlobales();
  }, [loadTableros, loadUsuarios, loadGlobales]);

  /* ── Derived ── */
  const otrosUsuarios = usuarios.filter(u => u.username !== currentUser?.username);
  const activos = todos.filter(t => !t.archivado);

  const efectivoArchivado = (t: Tablero): boolean =>
    archiveChanges.has(t.id) ? (archiveChanges.get(t.id) ?? false) : (t.archivado ?? false);

  /* ── Handlers: Usuarios ── */
  const getTablerosIds = (u: Usuario): number[] =>
    pendingUsers.get(u.id) ?? (u.tablerosIds ?? []);

  const handleToggleTablero = (usuario: Usuario, tableroId: number) => {
    const current = pendingUsers.get(usuario.id) ?? (usuario.tablerosIds ?? []);
    const updated = current.includes(tableroId)
      ? current.filter(id => id !== tableroId)
      : [...current, tableroId];
    setPendingUsers(prev => new Map(prev).set(usuario.id, updated));
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, tablerosIds: updated } : u));
  };

  /* ── Handlers: Etiquetas ── */
  const handleStageTag = (nombre: string, colorHex: string, colorTexto: string) => {
    setTagsToAdd(prev => [...prev, { nombre, colorHex, colorTexto }]);
    setShowCrearEtq(false);
  };

  const handleMarkDeleteTag = (id: number) =>
    setTagIdsToDelete(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Handlers: Archivar ── */
  const handleToggleArchivar = (t: Tablero) => {
    const nuevoEstado = !efectivoArchivado(t);
    setArchiveChanges(prev => {
      const next = new Map(prev);
      // Si el nuevo estado es igual al original, quitar del mapa (no hay cambio)
      if (nuevoEstado === t.archivado) {
        next.delete(t.id);
      } else {
        next.set(t.id, nuevoEstado);
      }
      return next;
    });
  };

  /* ── Handlers: Eliminar ── */
  const handleToggleEliminar = (id: number) =>
    setToDelete(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Texto del confirm por pestaña ── */
  const saveConfirmText = (): { title: string; body: string } => {
    if (tab === 'usuarios') {
      return {
        title: '¿Guardar asignación de tableros?',
        body: `Se actualizarán los tableros asignados para ${pendingUsers.size} usuario(s).`,
      };
    }
    if (tab === 'etiquetas') {
      const parts: string[] = [];
      if (tagsToAdd.length) parts.push(`crear ${tagsToAdd.length} etiqueta(s)`);
      if (tagIdsToDelete.size) parts.push(`eliminar ${tagIdsToDelete.size} etiqueta(s)`);
      return { title: '¿Guardar cambios en etiquetas?', body: `Se van a ${parts.join(' y ')}.` };
    }
    if (tab === 'archivar') {
      const arc = [...archiveChanges.values()].filter(Boolean).length;
      const des = archiveChanges.size - arc;
      const parts: string[] = [];
      if (arc) parts.push(`archivar ${arc} tablero(s)`);
      if (des) parts.push(`desarchivar ${des} tablero(s)`);
      return { title: '¿Guardar cambios de archivo?', body: `Se van a ${parts.join(' y ')}.` };
    }
    const names = [...toDelete]
      .map(id => todos.find(t => t.id === id)?.titulo ?? `#${id}`)
      .join(', ');
    return {
      title: '¿Eliminar tableros?',
      body: `Se eliminarán permanentemente: ${names}. Esta acción no se puede deshacer.`,
    };
  };

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true);
    setErrors(p => ({ ...p, save: '' }));
    try {
      if (tab === 'usuarios') {
        for (const [userId, tablerosIds] of pendingUsers) {
          const u = usuarios.find(u => u.id === userId);
          if (u) {
            await userService.actualizarUsuario(userId, {
              username: u.username,
              nombreCompleto: u.nombreCompleto ?? u.username,
              rol: u.rol,
              activo: u.activo ?? true,
              tablerosIds,
            });
          }
        }
        setPendingUsers(new Map());

      } else if (tab === 'etiquetas') {
        for (const tag of tagsToAdd) {
          const created = await etiquetaService.crearEtiqueta({ nombre: tag.nombre, colorHex: tag.colorHex, colorTexto: tag.colorTexto, tableroId: null });
          setGlobales(prev => [...prev, created]);
        }
        for (const id of tagIdsToDelete) {
          await etiquetaService.eliminarEtiqueta(id);
          setGlobales(prev => prev.filter(e => e.id !== id));
        }
        setTagsToAdd([]);
        setTagIdsToDelete(new Set());
        if (activeBoardId) loadBoardData(activeBoardId).catch(() => null);

      } else if (tab === 'archivar') {
        for (const [tableroId, archivado] of archiveChanges) {
          await tableroService.archivarTablero(tableroId, archivado);
        }
        setArchiveChanges(new Map());
        await loadTableros();
        onRefresh();

      } else if (tab === 'eliminar') {
        for (const tableroId of toDelete) {
          await tableroService.eliminarTablero(tableroId);
        }
        setToDelete(new Set());
        await loadTableros();
        onRefresh();
      }

      setShowSaveConfirm(false);
    } catch {
      setErrors(p => ({ ...p, save: 'Error al guardar. Intentá de nuevo.' }));
    } finally {
      setSaving(false);
    }
  };

  const confirmInfo = saveConfirmText();

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content shadow-lg">
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-gear-fill text-primary"></i> Configuración
              </h5>
              <button className="btn-close btn-close-white" onClick={onClose} />
            </div>

            <div className="modal-body p-0">
              <ul className="nav nav-tabs px-3 pt-3 border-bottom">
                {TAB_META.map(({ key, label, icon }) => (
                  <li key={key} className="nav-item">
                    <button
                      className={`nav-link d-flex align-items-center gap-2 ${tab === key ? 'active fw-semibold' : ''}`}
                      onClick={() => setTab(key)}
                    >
                      <i className={`bi ${icon}`}></i>
                      {label}
                      {dirtyCount[key] > 0 && (
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.6rem' }}>
                          {dirtyCount[key]}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="p-4">

                {/* ── USUARIOS ── */}
                {tab === 'usuarios' && (
                  <>
                    {errors.usuarios && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="bi bi-exclamation-triangle me-1" />{errors.usuarios}
                      </div>
                    )}
                    {loadingTabs.usuarios ? (
                      <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                    ) : (
                      <>
                        <p className="text-muted small mb-3">
                          Marcá los tableros de cada usuario. Los cambios se guardan al presionar <strong>Guardar cambios</strong>.
                        </p>
                        {otrosUsuarios.length === 0 && !errors.usuarios && (
                          <p className="text-muted small">No hay otros usuarios registrados.</p>
                        )}
                        {otrosUsuarios.map(u => {
                          const isPending = pendingUsers.has(u.id);
                          return (
                            <div key={u.id} className={`border rounded p-3 mb-3 ${isPending ? 'border-warning' : ''}`}>
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: 32, height: 32, minWidth: 32, fontSize: '0.75rem' }}
                                >
                                  {u.username.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="fw-semibold">{u.username}</span>
                                <span className="text-muted small">— {u.nombreCompleto}</span>
                                {isPending && (
                                  <span className="badge bg-warning text-dark ms-1 small">modificado</span>
                                )}
                                <span className={`badge ms-auto ${u.rol === Rol.ADMIN ? 'bg-danger' : 'bg-secondary'}`}>
                                  {u.rol}
                                </span>
                              </div>
                              {u.rol === Rol.ADMIN ? (
                                <small className="text-muted fst-italic">Admin tiene acceso a todos los tableros</small>
                              ) : activos.length === 0 ? (
                                <span className="text-muted small">No hay tableros activos</span>
                              ) : (
                                <div className="d-flex flex-wrap gap-2">
                                  {activos.map(t => (
                                    <div key={t.id} className="form-check form-check-inline m-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`u${u.id}-t${t.id}`}
                                        checked={getTablerosIds(u).includes(t.id)}
                                        onChange={() => handleToggleTablero(u, t.id)}
                                      />
                                      <label className="form-check-label small" htmlFor={`u${u.id}-t${t.id}`}>
                                        {t.titulo}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                )}

                {/* ── ETIQUETAS GLOBALES ── */}
                {tab === 'etiquetas' && (
                  <>
                    {errors.etiquetas && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="bi bi-exclamation-triangle me-1" />{errors.etiquetas}
                      </div>
                    )}
                    <p className="text-muted small mb-3">
                      Las etiquetas globales están disponibles en todos los tableros. Los cambios se guardan al presionar <strong>Guardar cambios</strong>.
                    </p>

                    {!showCrearEtq ? (
                      <button
                        className="btn btn-outline-primary btn-sm mb-3"
                        onClick={() => setShowCrearEtq(true)}
                      >
                        <i className="bi bi-plus-lg me-1" />Nueva etiqueta
                      </button>
                    ) : (
                      <div className="border rounded-3 p-3 mb-3 bg-light" style={{ maxWidth: 360 }}>
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                          <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Nueva etiqueta global</span>
                          <button type="button" className="btn btn-sm btn-link p-0 text-secondary" onClick={() => setShowCrearEtq(false)}>
                            <i className="bi bi-x" style={{ fontSize: '1.2rem' }} />
                          </button>
                        </div>
                        <EtiquetaCrearPanel
                          submitLabel="Agregar"
                          autoFocus
                          onSubmit={handleStageTag}
                        />
                      </div>
                    )}

                    {tagsToAdd.length > 0 && (
                      <div className="mb-3">
                        <p className="text-muted small mb-1 fw-semibold">
                          <i className="bi bi-clock me-1 text-warning" />Por guardar:
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {tagsToAdd.map((tag, i) => (
                            <div
                              key={i}
                              className="d-flex align-items-center gap-1 rounded px-2 py-1 border border-warning"
                              style={{ backgroundColor: tag.colorHex, color: tag.colorTexto }}
                            >
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{tag.nombre}</span>
                              <button
                                className="btn btn-sm p-0 ms-1 border-0 text-white opacity-75"
                                style={{ lineHeight: 1 }}
                                onClick={() => setTagsToAdd(prev => prev.filter((_, j) => j !== i))}
                                title="Quitar"
                              >
                                <i className="bi bi-x-lg" style={{ fontSize: '0.65rem' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {loadingTabs.etiquetas ? (
                      <div className="text-center py-2"><div className="spinner-border spinner-border-sm text-primary" /></div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {globales.map(e => {
                          const markedDelete = tagIdsToDelete.has(e.id);
                          return (
                            <div
                              key={e.id}
                              className={`d-flex align-items-center gap-1 rounded px-2 py-1 ${markedDelete ? 'opacity-50' : ''}`}
                              style={{
                                backgroundColor: markedDelete ? '#6c757d' : (e.colorHex ?? '#3b82f6'),
                                color: markedDelete ? '#fff' : getContrastColor(e.colorHex ?? '#3b82f6'),
                                textDecoration: markedDelete ? 'line-through' : 'none',
                              }}
                            >
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{e.nombre}</span>
                              <button
                                className="btn btn-sm p-0 ms-1 border-0 text-white opacity-75"
                                style={{ lineHeight: 1 }}
                                onClick={() => handleMarkDeleteTag(e.id)}
                                title={markedDelete ? 'Desmarcar' : 'Marcar para eliminar'}
                              >
                                <i
                                  className={`bi ${markedDelete ? 'bi-arrow-counterclockwise' : 'bi-x-lg'}`}
                                  style={{ fontSize: '0.65rem' }}
                                />
                              </button>
                            </div>
                          );
                        })}
                        {globales.length === 0 && tagsToAdd.length === 0 && (
                          <p className="text-muted small">No hay etiquetas globales guardadas.</p>
                        )}
                      </div>
                    )}
                    {tagIdsToDelete.size > 0 && (
                      <p className="text-muted small mt-2 mb-0">
                        <i className="bi bi-exclamation-circle me-1 text-warning" />
                        {tagIdsToDelete.size} etiqueta(s) marcada(s) para eliminar.
                      </p>
                    )}
                  </>
                )}

                {/* ── ARCHIVAR ── */}
                {tab === 'archivar' && (
                  <>
                    {errors.tableros && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="bi bi-exclamation-triangle me-1" />{errors.tableros}
                      </div>
                    )}
                    <p className="text-muted small mb-3">
                      Los tableros archivados no aparecen en el sidebar. Los cambios se guardan al presionar <strong>Guardar cambios</strong>.
                    </p>
                    {loadingTabs.tableros ? (
                      <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                    ) : todos.length === 0 ? (
                      <p className="text-muted small">No hay tableros.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Tablero</th>
                              <th style={{ width: 150 }}>Estado</th>
                              <th style={{ width: 180 }} className="text-end">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todos.map(t => {
                              const efectivo = efectivoArchivado(t);
                              const isPending = archiveChanges.has(t.id);
                              return (
                                <tr key={t.id} className={isPending ? 'table-warning' : efectivo ? 'table-secondary' : ''}>
                                  <td className={efectivo && !isPending ? 'text-muted fst-italic' : 'fw-semibold'}>
                                    {t.titulo}
                                  </td>
                                  <td>
                                    {efectivo
                                      ? <span className="badge bg-secondary">Archivado</span>
                                      : <span className="badge bg-success">Activo</span>}
                                  </td>
                                  <td className="text-end d-flex gap-1 justify-content-end">
                                    <button
                                      className={`btn btn-sm ${efectivo ? 'btn-outline-success' : 'btn-outline-warning'}`}
                                      onClick={() => handleToggleArchivar(t)}
                                    >
                                      {efectivo
                                        ? <><i className="bi bi-arrow-counterclockwise me-1" />Desarchivar</>
                                        : <><i className="bi bi-archive me-1" />Archivar</>}
                                    </button>
                                    {isPending && (
                                      <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => handleToggleArchivar(t)}
                                        title="Deshacer"
                                      >
                                        <i className="bi bi-arrow-counterclockwise" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* ── ELIMINAR ── */}
                {tab === 'eliminar' && (
                  <>
                    {errors.tableros && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="bi bi-exclamation-triangle me-1" />{errors.tableros}
                      </div>
                    )}
                    <div className="alert alert-danger py-2 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      Marcá los tableros a eliminar y presioná <strong>Guardar cambios</strong> para confirmar. Esta acción es <strong>irreversible</strong>.
                    </div>
                    {loadingTabs.tableros ? (
                      <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                    ) : todos.length === 0 ? (
                      <p className="text-muted small">No hay tableros.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Tablero</th>
                              <th style={{ width: 120 }}>Estado</th>
                              <th style={{ width: 130 }} className="text-end">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todos.map(t => {
                              const marked = toDelete.has(t.id);
                              return (
                                <tr key={t.id} className={marked ? 'table-danger' : t.archivado ? 'table-secondary' : ''}>
                                  <td className={marked ? 'text-decoration-line-through text-muted' : t.archivado ? 'text-muted fst-italic' : 'fw-semibold'}>
                                    {t.titulo}
                                  </td>
                                  <td>
                                    {t.archivado
                                      ? <span className="badge bg-secondary">Archivado</span>
                                      : <span className="badge bg-success">Activo</span>}
                                  </td>
                                  <td className="text-end">
                                    {marked ? (
                                      <button className="btn btn-outline-secondary btn-sm" onClick={() => handleToggleEliminar(t.id)}>
                                        <i className="bi bi-arrow-counterclockwise me-1" />Desmarcar
                                      </button>
                                    ) : (
                                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleToggleEliminar(t.id)}>
                                        <i className="bi bi-trash me-1" />Eliminar
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {toDelete.size > 0 && (
                      <p className="text-danger small mt-2 mb-0">
                        <i className="bi bi-exclamation-circle me-1" />
                        {toDelete.size} tablero(s) marcado(s) para eliminar.
                      </p>
                    )}
                  </>
                )}

                {errors.save && (
                  <div className="alert alert-danger py-2 small mt-3 mb-0">
                    <i className="bi bi-x-circle me-1" />{errors.save}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              {isDirty && currentUser?.rol === Rol.ADMIN && (
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  onClick={() => setShowSaveConfirm(true)}
                >
                  <i className="bi bi-floppy-fill"></i> Guardar cambios
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal confirmación de guardado ── */}
      {showSaveConfirm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0 pb-1">
                <h6 className="modal-title fw-bold">{confirmInfo.title}</h6>
              </div>
              <div className="modal-body pt-0">
                <p className="small text-muted mb-0">{confirmInfo.body}</p>
                {errors.save && (
                  <div className="alert alert-danger py-2 small mt-2 mb-0">
                    <i className="bi bi-x-circle me-1" />{errors.save}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0 gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowSaveConfirm(false); setErrors(p => ({ ...p, save: '' })); }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className={`btn btn-sm ${tab === 'eliminar' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                    : <><i className="bi bi-check-lg me-1" />Confirmar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
