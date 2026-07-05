import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassNavbar } from '../../components/layout/GlassNavbar';
import { ConfiguracionModal } from './modals/ConfiguracionModal';
import { TableroModal } from '../kanban/modals/TableroModal';
import { useBoardStore } from '../../stores/boardStore';
import { useAuthStore } from '../../stores/authStore';
import type { Tablero } from '../../types';
import { Rol } from '../../types';
import { tableroService } from '../../services/tableroService';
import toast from 'react-hot-toast';

const BG_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

function boardColor(id: number): string {
  return BG_COLORS[id % BG_COLORS.length];
}

export function BoardsOverviewPage() {
  const navigate = useNavigate();
  const { loadBoards, createBoard } = useBoardStore();
  const { user } = useAuthStore();
  const isAdmin = user?.rol === Rol.ADMIN;
  const [boards, setBoards] = useState<Tablero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tableroService.getMisTableros();
      setBoards(data);
    } catch {
      toast.error('Error cargando tableros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadBoards().catch(() => null);
  }, [load, loadBoards]);

  useEffect(() => {
    document.title = 'GT | Tableros';
    return () => { document.title = 'GT | GestorTareas'; };
  }, []);

  const handleSelectBoard = (id: number) => navigate(`/kanban/${id}`);

  const handleCreateBoard = async (nombre: string, descripcion?: string, imagenFondoUrl?: string) => {
    try {
      const nb = await createBoard(nombre, descripcion, imagenFondoUrl);
      setShowNewBoard(false);
      toast.success('Tablero creado');
      navigate(`/kanban/${nb.id}`);
    } catch {
      toast.error('Error creando tablero');
    }
  };

  const handleRefresh = () => {
    load();
    loadBoards().catch(() => null);
  };

  return (
    <div className="cpq-layout">
      <Sidebar onSelectBoard={handleSelectBoard} />

      <div className="cpq-content">
        {/* Header */}
        <GlassNavbar
          left={
            <h4 className="fw-bold mb-0" style={{ color: 'var(--cpq-text-title)', fontSize: '1.35rem' }}>
              <i className="bi bi-grid-fill me-2"></i>Mis Tableros
            </h4>
          }
        >
          {isAdmin && (
            <button
              className={`btn cpq-navbar-btn ${showConfig ? 'btn-gray-active' : ''}`}
              onClick={() => setShowConfig(true)}
            >
              <i className="bi bi-gear-fill fs-5" />
              <span>Configuración</span>
            </button>
          )}
        </GlassNavbar>

        {/* Grid */}
        <div className="flex-grow-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-kanban fs-1 mb-3 d-block text-primary"></i>
              <h5>No tenés tableros asignados</h5>
              {isAdmin ? (
                <>
                  <p className="small">Creá un tablero nuevo para empezar.</p>
                  <button className="btn btn-primary" onClick={() => setShowNewBoard(true)}>
                    <i className="bi bi-plus-lg me-1" />Crear Tablero
                  </button>
                </>
              ) : (
                <p className="small">Pedí al administrador que te asigne un tablero.</p>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {boards.map((b) => (
                <div key={b.id} className="col-6 col-md-4 col-lg-3">
                  <div
                    className="card border-0 shadow-sm h-100 overflow-hidden"
                    style={{ cursor: 'pointer', borderRadius: 12 }}
                    onClick={() => handleSelectBoard(b.id)}
                  >
                    {/* Header de color */}
                    <div
                      style={{
                        height: 80,
                        background: b.imagenFondoUrl
                          ? `url(${b.imagenFondoUrl}) center/cover`
                          : `linear-gradient(135deg, ${boardColor(b.id)}, ${boardColor(b.id + 3)})`,
                      }}
                    />
                    <div className="card-body py-2 px-3">
                      <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--cpq-primary)' }}>
                        {b.titulo}
                      </h6>
                      {b.descripcion && (
                        <p className="text-muted small mb-0 text-truncate">{b.descripcion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Crear nuevo */}
              <div className="col-6 col-md-4 col-lg-3">
                {isAdmin && (
                  <div
                    className="card border-dashed h-100 d-flex align-items-center justify-content-center text-muted"
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      minHeight: 120,
                      border: '2px dashed #dee2e6',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => setShowNewBoard(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6c757d')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#dee2e6')}
                  >
                    <div className="text-center">
                      <i className="bi bi-plus-lg fs-4 d-block mb-1"></i>
                      <small>Crear un tablero nuevo</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfig && (
        <ConfiguracionModal onClose={() => setShowConfig(false)} onRefresh={handleRefresh} />
      )}

      {showNewBoard && (
        <TableroModal onClose={() => setShowNewBoard(false)} onSubmit={handleCreateBoard} />
      )}
    </div>
  );
}
