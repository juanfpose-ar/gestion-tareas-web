import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassNavbar } from '../../components/layout/GlassNavbar';
import { CreateUserModal } from './modals/CreateUserModal';
import { EditUserModal } from './modals/EditUserModal';
import { BlanqueoPasswordModal } from './modals/BlanqueoPasswordModal';
import { InactiveUsersPanel } from './components/InactiveUsersPanel';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { Rol } from '../../types';
import type { Usuario } from '../../types';
import toast from 'react-hot-toast';

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#212529' : '#ffffff';
}

function UserDetailPanel({ u }: { u: Usuario }) {
  return (
    <div
      className="px-4 py-3 d-flex flex-wrap gap-4"
      style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}
    >
      {/* Email */}
      <div>
        <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: '#94a3b8' }}>
          <i className="bi bi-envelope me-1" />Email
        </div>
        {u.email
          ? <a href={`mailto:${u.email}`} className="text-decoration-none small fw-semibold">{u.email}</a>
          : <span className="small text-muted fst-italic">Sin email</span>}
      </div>

      {/* Estado */}
      <div>
        <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: '#94a3b8' }}>
          <i className="bi bi-toggle-on me-1" />Estado
        </div>
        <span className={`badge rounded-pill ${u.activo !== false ? 'bg-success' : 'bg-secondary'}`}>
          {u.activo !== false ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Rol */}
      <div>
        <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: '#94a3b8' }}>
          <i className="bi bi-shield me-1" />Rol
        </div>
        <span className={`badge ${u.rol === Rol.ADMIN ? 'bg-danger' : 'bg-info text-dark'}`}>
          {u.rol}
        </span>
      </div>

      {/* Tableros */}
      <div>
        <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: '#94a3b8' }}>
          <i className="bi bi-kanban me-1" />Tableros
        </div>
        <span className="small text-dark fw-semibold">
          {u.tablerosIds && u.tablerosIds.length > 0
            ? `${u.tablerosIds.length} tablero${u.tablerosIds.length > 1 ? 's' : ''}`
            : u.rol === Rol.ADMIN
            ? 'Todos (admin)'
            : 'Ninguno'}
        </span>
      </div>
    </div>
  );
}

export function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.rol === Rol.ADMIN;
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [blanqueoUser, setBlanqueoUser] = useState<Usuario | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsuarios();
      setUsers(data);
    } catch {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    document.title = 'GT | Usuarios';
    return () => { document.title = 'GT | GestorTareas'; };
  }, []);

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  const visibleUsers = users.filter(u => u.activo !== false);
  const inactiveUsers = users.filter(u => u.activo === false);

  return (
    <div className="cpq-layout">
      <Sidebar onSelectBoard={(id) => navigate(`/kanban/${id}`)} />

      <div className="cpq-content">
        <GlassNavbar
          left={
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--cpq-text-title)', fontSize: '1.35rem' }}>
              <i className="bi bi-people-fill" style={{ color: '#3b82f6' }}></i>
              Usuarios del Sistema
            </h4>
          }
        >
          {isAdmin && (
            <button
              className={`btn cpq-navbar-btn ${showInactive ? 'btn-gray-active' : ''}`}
              onClick={() => setShowInactive(v => !v)}
            >
              <i className="bi bi-person-x-fill fs-5" />
              <span>Inactivos{inactiveUsers.length > 0 ? ` (${inactiveUsers.length})` : ''}</span>
            </button>
          )}
          {isAdmin && (
            <button
              className="btn cpq-navbar-btn"
              onClick={() => setShowCreate(true)}
            >
              <i className="bi bi-person-plus-fill fs-5" />
              <span>Crear Usuario</span>
            </button>
          )}
        </GlassNavbar>

        <div className="flex-grow-1 d-flex flex-row overflow-hidden p-4 gap-3">
          {showInactive && (
            <InactiveUsersPanel
              users={inactiveUsers}
              onClose={() => setShowInactive(false)}
              onEdit={(u) => setEditingUser(u)}
            />
          )}
          <div className="flex-grow-1 overflow-auto">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="card border-0 shadow-sm overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th style={{ width: 40 }}>#</th>
                    <th>Usuario</th>
                    <th>Nombre Completo</th>
                    <th style={{ width: 80 }}>Rol</th>
                    {isAdmin && <th style={{ width: 80 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="text-center text-muted py-5">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    visibleUsers.map((u, idx) => (
                      <>
                        <tr
                          key={u.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleExpand(u.id)}
                        >
                          <td className="text-center text-muted ps-3" style={{ width: 32 }}>
                            <i className={`bi bi-chevron-${expandedId === u.id ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }} />
                          </td>
                          <td className="text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                style={{
                                  width: 32, height: 32, fontSize: '0.8rem',
                                  background: u.colorAvatar ?? '#0d6efd',
                                  color: contrastColor(u.colorAvatar ?? '#0d6efd'),
                                }}
                              >
                                {(u.nombreCompleto || u.username).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <span className="fw-semibold">@{u.username}</span>
                            </div>
                          </td>
                          <td>{u.nombreCompleto ?? u.nombre ?? '—'}</td>
                          <td>
                            <span className={`badge ${u.rol === Rol.ADMIN ? 'bg-danger' : 'bg-info text-dark'}`}>
                              {u.rol}
                            </span>
                          </td>
                          {isAdmin && (
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setEditingUser(u)}
                                  title="Editar usuario"
                                >
                                  <i className="bi bi-pencil-fill" />
                                </button>
                                <button
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => setBlanqueoUser(u)}
                                  title="Blanquear contraseña"
                                >
                                  <i className="bi bi-key-fill" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>

                        {expandedId === u.id && (
                          <tr key={`${u.id}-detail`}>
                            <td colSpan={isAdmin ? 6 : 5} className="p-0">
                              <UserDetailPanel u={u} />
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-muted small mt-3">
            <i className="bi bi-info-circle me-1" />
            Para asignar tableros a usuarios, usá{' '}
            <button
              className="btn btn-link btn-sm p-0 align-baseline"
              onClick={() => navigate('/tableros')}
            >
              Ver Tableros → Configuración
            </button>
            .
          </p>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {editingUser && (
        <EditUserModal
          usuario={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); load(); }}
        />
      )}
      {blanqueoUser && (
        <BlanqueoPasswordModal
          usuario={blanqueoUser}
          onClose={() => setBlanqueoUser(null)}
        />
      )}
    </div>
  );

  function handleCreated() {
    setShowCreate(false);
    load();
  }
}
