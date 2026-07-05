import React, { useEffect, useState } from 'react';
import { Usuario, Tablero, Rol } from '../../../types';
import { userService } from '../../../services/userService';

interface UserManagementModalProps {
  boards: Tablero[];
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ boards, onClose }) => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState<Rol>(Rol.USER);
  const [selectedBoardIds, setSelectedBoardIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await userService.getUsuarios();
      setUsers(list);
    } catch (err) {
      console.error("Error al cargar usuarios", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBoard = (boardId: number) => {
    setSelectedBoardIds(prev =>
      prev.includes(boardId) ? prev.filter(id => id !== boardId) : [...prev, boardId]
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !nombreCompleto.trim()) {
      setError('Todos los campos obligatorios deben ser completados');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await userService.crearUsuario({
        username: username.trim(),
        password: password.trim(),
        nombreCompleto: nombreCompleto.trim(),
        rol,
        tablerosIds: selectedBoardIds
      });
      // Reset form
      setUsername('');
      setPassword('');
      setNombreCompleto('');
      setRol(Rol.USER);
      setSelectedBoardIds([]);
      setShowCreateForm(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el usuario. Verifique los datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await userService.eliminarUsuario(userId);
        await loadUsers();
      } catch (err) {
        alert('No se pudo eliminar el usuario');
      }
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header bg-white text-dark">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-people-fill text-primary"></i> Gestión de Usuarios y Equipo
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {!showCreateForm ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">Usuarios Registrados ({users.length})</h6>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
                    <i className="bi bi-person-plus-fill me-1"></i> Nuevo Usuario
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle border">
                      <thead className="table-light">
                        <tr>
                          <th>Usuario</th>
                          <th>Nombre Completo</th>
                          <th>Rol</th>
                          <th>Tableros Asignados</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td className="fw-bold text-dark">{u.username}</td>
                            <td>{u.nombreCompleto || u.nombre}</td>
                            <td>
                              <span className={`badge ${u.rol === Rol.ADMIN ? 'bg-danger' : 'bg-info text-dark'}`}>
                                {u.rol}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">
                                {u.tablerosIds && u.tablerosIds.length > 0
                                  ? boards
                                      .filter(b => u.tablerosIds?.includes(b.id))
                                      .map(b => b.titulo)
                                      .join(', ') || `${u.tablerosIds.length} tableros`
                                  : 'Ninguno'}
                              </small>
                            </td>
                            <td className="text-end">
                              {u.username !== 'admin' && (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Eliminar usuario"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <h6 className="fw-bold text-primary mb-3">Crear Nuevo Usuario de Equipo</h6>
                {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="ej: juanperez"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold small">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="ej: Juan Pérez"
                      value={nombreCompleto}
                      onChange={e => setNombreCompleto(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Rol del Sistema</label>
                    <select
                      className="form-select"
                      value={rol}
                      onChange={e => setRol(e.target.value as Rol)}
                    >
                      <option value={Rol.USER}>Usuario (USER)</option>
                      <option value={Rol.ADMIN}>Administrador (ADMIN)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Asignar Tableros a este Usuario</label>
                  <div className="border rounded p-3 bg-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {boards.length === 0 ? (
                      <div className="text-muted small">No hay tableros creados aún en el sistema.</div>
                    ) : (
                      boards.map(b => (
                        <div key={b.id} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`board-chk-${b.id}`}
                            checked={selectedBoardIds.includes(b.id)}
                            onChange={() => handleToggleBoard(b.id)}
                          />
                          <label className="form-check-label text-dark small" htmlFor={`board-chk-${b.id}`}>
                            {b.titulo}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Usuario'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
