import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useBoardStore } from '../../stores/boardStore';
import { useUiStore } from '../../stores/uiStore';
import { useMensajeriaStore } from '../../stores/mensajeriaStore';
import { Rol } from '../../types';

interface SidebarProps {
  onSelectBoard: (id: number) => void;
}

export function Sidebar({ onSelectBoard }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { boards, activeBoardId } = useBoardStore();
  const { tablerosExpanded, setTablerosExpanded, sidebarCollapsed, setSidebarCollapsed } = useUiStore();
  const { unreadCount, refreshUnreadCount } = useMensajeriaStore();

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isAdmin = user?.rol === Rol.ADMIN;
  const collapsed = sidebarCollapsed;

  return (
    <div className={`cpq-sidebar py-3 d-flex flex-column border-end border-dark ${collapsed ? 'collapsed' : ''}`}>

      {/* ── Header ── */}
      <div
        className="px-2 mb-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center"
        style={{ minHeight: 44, gap: '0.25rem' }}
      >
        <i className="bi bi-kanban-fill text-danger flex-shrink-0" style={{ fontSize: '1.15rem', marginLeft: collapsed ? 'auto' : '0.25rem' }}></i>
        {!collapsed && (
          <span
            className="text-white fw-bold text-truncate"
            style={{ fontSize: '0.95rem', flex: 1, minWidth: 0, paddingLeft: '0.4rem' }}
          >
            Gestión de Tareas
          </span>
        )}
        <button
          className="btn btn-sm border-0 bg-transparent p-1 flex-shrink-0 ms-auto"
          style={{ color: '#6c757d' }}
          onClick={() => setSidebarCollapsed(!collapsed)}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
        </button>
      </div>

      {/* ── Nav items ── */}
      <div className="flex-grow-1 overflow-auto">

        {/* Ver Tableros — con acordeón de tableros */}
        <div>
          <div
            className={`nav-link w-100 d-flex align-items-center justify-content-between ${isActive('/tableros') || isActive('/kanban') ? 'active' : ''}`}
            style={{ cursor: 'default' }}
            title={collapsed ? 'Ver Tableros' : undefined}
          >
            <button
              type="button"
              className="border-0 bg-transparent p-0 d-flex align-items-center gap-2 flex-grow-1 text-start"
              style={{ color: 'inherit', fontWeight: 600 }}
              onClick={() => navigate('/tableros')}
            >
              <i className="bi bi-grid flex-shrink-0"></i>
              <span className="cpq-sidebar-label">Ver Tableros</span>
            </button>
            {!collapsed && (
              <button
                type="button"
                className="border-0 bg-transparent p-0 ms-1 flex-shrink-0"
                style={{ color: 'inherit', lineHeight: 1 }}
                onClick={() => setTablerosExpanded(!tablerosExpanded)}
                title={tablerosExpanded ? 'Colapsar tableros' : 'Expandir tableros'}
              >
                <i className={`bi bi-chevron-${tablerosExpanded ? 'down' : 'right'} small`}></i>
              </button>
            )}
          </div>

          {tablerosExpanded && !collapsed && (
            <div className="bg-black bg-opacity-25 ps-2">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBoard(b.id)}
                  className={`nav-link w-100 text-start ps-4 py-2 border-0 bg-transparent ${
                    activeBoardId === b.id && isActive('/kanban') ? 'active' : ''
                  }`}
                >
                  <i className={`bi ${activeBoardId === b.id && isActive('/kanban') ? 'bi-folder2-open' : 'bi-folder2'} me-2`}></i>
                  <span className="text-truncate">{b.titulo}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bandeja de entrada */}
        <button
          onClick={() => navigate('/bandeja')}
          className={`nav-link w-100 border-0 bg-transparent ${isActive('/bandeja') ? 'active' : ''}`}
          title={collapsed ? 'Bandeja de entrada' : undefined}
        >
          <i className="bi bi-envelope-fill flex-shrink-0"></i>
          <span className="cpq-sidebar-label"> Bandeja de entrada</span>
          {!collapsed && unreadCount > 0 && (
            <i className="bi bi-bell-fill ms-auto text-warning" title="Tenés mensajes sin leer"></i>
          )}
        </button>

        {/* Usuarios (solo admin) */}
        {isAdmin && (
          <button
            onClick={() => navigate('/usuarios')}
            className={`nav-link w-100 border-0 bg-transparent ${isActive('/usuarios') ? 'active' : ''}`}
            title={collapsed ? 'Usuarios' : undefined}
          >
            <i className="bi bi-people-fill flex-shrink-0"></i>
            <span className="cpq-sidebar-label"> Usuarios</span>
          </button>
        )}

      </div>

      {/* ── Footer de perfil ── */}
      {user && (
        <div className="pt-2 border-top border-secondary border-opacity-25 mt-auto" style={{ padding: '0.5rem' }}>
          {collapsed ? (
            /* Colapsado: avatar + iconos apilados */
            <div className="d-flex flex-column align-items-center gap-2 py-1">
              <div
                className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: 32, height: 32, fontSize: '0.8rem' }}
              >
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <button
                className="btn btn-sm border-0 bg-transparent p-0"
                style={{ color: '#6c757d' }}
                onClick={() => navigate('/cambiar-password')}
                title="Cambiar contraseña"
              >
                <i className="bi bi-shield-lock" style={{ fontSize: '1.1rem' }}></i>
              </button>
              <button
                className="btn btn-sm border-0 bg-transparent p-0 text-danger"
                onClick={() => { logout().catch(() => null); }}
                title="Cerrar Sesión"
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: '1.1rem' }}></i>
              </button>
            </div>
          ) : (
            /* Expandido: avatar + nombre + botones */
            <div
              className="d-flex align-items-center p-2 rounded gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                style={{ width: 32, height: 32, minWidth: 32, fontSize: '0.85rem' }}
              >
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-truncate flex-grow-1" style={{ fontSize: '0.8rem', minWidth: 0 }}>
                <div className="fw-semibold text-white text-truncate">
                  {user.nombreCompleto ?? user.username}
                </div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>@{user.username}</div>
              </div>
              <div className="d-flex gap-1 flex-shrink-0">
                <button
                  className="btn btn-sm border-0 bg-transparent p-1"
                  style={{ color: '#6c757d' }}
                  onClick={() => navigate('/cambiar-password')}
                  title="Cambiar contraseña"
                >
                  <i className="bi bi-shield-lock fs-6"></i>
                </button>
                <button
                  className="btn btn-sm border-0 bg-transparent p-1 text-danger"
                  onClick={() => { logout().catch(() => null); }}
                  title="Cerrar Sesión"
                >
                  <i className="bi bi-box-arrow-right fs-6"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
