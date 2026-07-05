import { useState } from 'react';
import type { Usuario } from '../../../types';
import { Rol } from '../../../types';
import { userService } from '../../../services/userService';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  '#0d6efd', '#198754', '#dc3545', '#6f42c1',
  '#fd7e14', '#d63384', '#20c997', '#0dcaf0',
  '#ffc107', '#212529',
];

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#212529' : '#ffffff';
}

interface Props {
  usuario: Usuario;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ usuario, onClose, onSaved }: Props) {
  const [username, setUsername] = useState(usuario.username);
  const [nombreCompleto, setNombreCompleto] = useState(usuario.nombreCompleto ?? '');
  const [email, setEmail] = useState(usuario.email ?? '');
  const [colorAvatar, setColorAvatar] = useState(usuario.colorAvatar ?? '#0d6efd');
  const [activo, setActivo] = useState(usuario.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initials = (usuario.nombreCompleto || usuario.username || '?')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'El usuario es obligatorio';
    if (!nombreCompleto.trim()) errs.nombreCompleto = 'El nombre completo es obligatorio';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await userService.actualizarUsuario(usuario.id, {
        username: username.trim(),
        nombreCompleto: nombreCompleto.trim(),
        rol: usuario.rol,
        activo,
        tablerosIds: usuario.tablerosIds ?? [],
        email: email.trim() || undefined,
        colorAvatar,
      });
      toast.success('Usuario actualizado');
      onSaved();
    } catch {
      toast.error('Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">
          <div className="modal-header bg-white text-dark">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-pencil-fill text-primary" /> Editar Usuario
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">

              {/* Avatar preview + color picker */}
              <div className="mb-4">
                <label className="form-label fw-semibold small">Color del avatar</label>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: 42, height: 42, fontSize: '0.9rem', background: colorAvatar, color: contrastColor(colorAvatar) }}
                  >
                    {initials}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorAvatar(c)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                          outline: colorAvatar === c ? `3px solid ${c}` : '2px solid transparent',
                          outlineOffset: 2, cursor: 'pointer', position: 'relative',
                        }}
                        title={c}
                      >
                        {colorAvatar === c && (
                          <i
                            className="bi bi-check"
                            style={{ color: contrastColor(c), fontSize: '0.75rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Usuario (login)</label>
                <input
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="off"
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Nombre Completo</label>
                <input
                  type="text"
                  className={`form-control ${errors.nombreCompleto ? 'is-invalid' : ''}`}
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                />
                {errors.nombreCompleto && <div className="invalid-feedback">{errors.nombreCompleto}</div>}
              </div>

              {usuario.rol !== Rol.ADMIN && (
                <div className="mb-3">
                  <label className="form-label fw-semibold small d-block">Estado</label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="activoSwitch"
                      checked={activo}
                      onChange={e => setActivo(e.target.checked)}
                      style={{ width: '2.5em', height: '1.25em' }}
                    />
                    <label className="form-check-label ms-2" htmlFor="activoSwitch">
                      <span className={`badge rounded-pill ${activo ? 'bg-success' : 'bg-secondary'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="ej: usuario@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                  : <><i className="bi bi-floppy-fill me-1" />Guardar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
