import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema } from '../../validation/schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [inactivo, setInactivo] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ username: username.trim(), password: password.trim() });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'username' | 'password';
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(result.data.username, result.data.password);
      const usuario = res.usuario;
      if (!usuario) throw new Error('Respuesta de autenticación inválida');
      login(res.token, usuario);
      navigate('/tableros', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message ?? '';
      if (status === 403 && message === 'USUARIO_INACTIVO') {
        setInactivo(true);
      } else {
        setErrors({ general: 'Credenciales inválidas. Por favor intentá de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (inactivo) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-dark">
        <div className="card shadow-lg p-5 border-0 rounded-4 text-center" style={{ width: '100%', maxWidth: '420px' }}>
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: 64, height: 64, background: '#fef3c7' }}
          >
            <i className="bi bi-person-slash" style={{ fontSize: '2rem', color: '#d97706' }} />
          </div>
          <h5 className="fw-bold text-dark mb-2">Cuenta inactiva</h5>
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
            Tu usuario se encuentra inactivo.<br />
            Contactá al administrador del sistema para reactivar tu cuenta.
          </p>
          <button
            className="btn btn-outline-secondary"
            onClick={() => { setInactivo(false); setUsername(''); setPassword(''); }}
          >
            <i className="bi bi-arrow-left me-1" />Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-dark">
      <div className="card shadow-lg p-4 border-0 rounded-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <div
            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style={{ width: '60px', height: '60px' }}
          >
            <i className="bi bi-kanban-fill fs-2" />
          </div>
          <h4 className="fw-bold text-dark mb-1">Gestión de Tareas</h4>
          <p className="text-muted small">Inicia sesión en tu cuenta</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger small py-2 mb-3" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">Usuario</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person text-muted" />
              </span>
              <input
                type="text"
                className={`form-control bg-light border-start-0 ${errors.username ? 'is-invalid' : ''}`}
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock text-muted" />
              </span>
              <input
                type="password"
                className={`form-control bg-light border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-semibold py-2" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
