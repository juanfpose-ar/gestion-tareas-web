import { useState } from 'react';
import { userService } from '../../../services/userService';
import { Rol } from '../../../types';
import { createUserSchema } from '../../../validation/schemas';
import { passwordRules } from '../../../utils/passwordValidation';
import { generatePassword, type GeneratedPassword } from '../../../utils/passwordGenerator';
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
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#212529' : '#ffffff';
}

function PasswordStrengthPanel({ password }: { password: string }) {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  const percent = Math.round((passed / passwordRules.length) * 100);
  const color =
    passed <= 1 ? '#dc3545' :
    passed <= 2 ? '#fd7e14' :
    passed <= 3 ? '#ffc107' :
    passed <= 4 ? '#3b82f6' : '#198754';
  const label =
    passed <= 1 ? 'Muy débil' :
    passed <= 2 ? 'Débil' :
    passed <= 3 ? 'Aceptable' :
    passed <= 4 ? 'Buena' : 'Segura ✓';

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Fortaleza</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{label}</span>
      </div>
      <div className="progress mb-2" style={{ height: 4, borderRadius: 2 }}>
        <div
          className="progress-bar"
          style={{ width: `${percent}%`, background: color, transition: 'all 0.3s ease' }}
        />
      </div>
      <div className="d-flex flex-column gap-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <span
              key={rule.label}
              className="d-flex align-items-center gap-1"
              style={{ fontSize: '0.75rem', color: ok ? '#198754' : '#94a3b8' }}
            >
              <i className={`bi bi-${ok ? 'check-circle-fill' : 'circle'}`} style={{ fontSize: '0.7rem' }} />
              {rule.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ onClose, onCreated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [colorAvatar, setColorAvatar] = useState('#0d6efd');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPassword | null>(null);
  const [copied, setCopied] = useState(false);

  const initials = (nombreCompleto || username || '?')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleGenerate = () => {
    setGenerated(generatePassword());
    setCopied(false);
  };

  const handleUseGenerated = () => {
    if (!generated) return;
    setPassword(generated.password);
    setShowPwd(true);
  };

  const handleCopy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse({
      username: username.trim(),
      password: password.trim(),
      nombreCompleto: nombreCompleto.trim(),
    });

    const extraErrors: Record<string, string> = {};
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      extraErrors.email = 'Email inválido';
    }
    const pwdFailed = passwordRules.filter((r) => !r.test(password.trim()));
    if (pwdFailed.length > 0) {
      extraErrors.password = `La contraseña no cumple: ${pwdFailed[0].label.toLowerCase()}`;
    }

    if (!result.success || Object.keys(extraErrors).length > 0) {
      const errs: Record<string, string> = { ...extraErrors };
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = String(issue.path[0]);
          if (!errs[key]) errs[key] = issue.message;
        }
      }
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await userService.crearUsuario({
        username: result.data.username,
        password: result.data.password,
        nombreCompleto: result.data.nombreCompleto,
        rol: Rol.USER,
        activo: true,
        email: email.trim() || undefined,
        colorAvatar,
      });
      toast.success('Usuario creado correctamente');
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el usuario. Verificá los datos.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow">
          <div className="modal-header bg-white text-dark">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill text-primary" /> Crear Usuario
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">
              <div className="row g-4">

                {/* Columna izquierda */}
                <div className="col-md-6">
                  {/* Avatar color */}
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
                              width: 26, height: 26, borderRadius: '50%', background: c, border: 'none',
                              outline: colorAvatar === c ? `3px solid ${c}` : '2px solid transparent',
                              outlineOffset: 2, cursor: 'pointer', position: 'relative',
                            }}
                          >
                            {colorAvatar === c && (
                              <i className="bi bi-check" style={{ color: contrastColor(c), fontSize: '0.7rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
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
                      placeholder="ej: juanperez"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                    />
                    {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Nombre Completo</label>
                    <input
                      type="text"
                      className={`form-control ${errors.nombreCompleto ? 'is-invalid' : ''}`}
                      placeholder="ej: Juan Pérez"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                    />
                    {errors.nombreCompleto && <div className="invalid-feedback">{errors.nombreCompleto}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="ej: usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                </div>

                {/* Columna derecha — Contraseña */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Contraseña</label>
                    <div className="input-group">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className={`form-control font-monospace ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setGenerated(null); }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPwd((v) => !v)}
                        title={showPwd ? 'Ocultar' : 'Mostrar'}
                      >
                        <i className={`bi bi-eye${showPwd ? '-slash' : ''}`} />
                      </button>
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>

                    {/* Strength indicator */}
                    {password && <PasswordStrengthPanel password={password} />}
                  </div>

                  {/* Generator */}
                  <div className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small mb-0">Contraseña sugerida</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        style={{ fontSize: '0.78rem' }}
                        onClick={handleGenerate}
                      >
                        <i className="bi bi-arrow-clockwise me-1" />Generar
                      </button>
                    </div>

                    {generated ? (
                      <>
                        <div className="input-group input-group-sm mb-1">
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={generated.password}
                            readOnly
                            style={{ letterSpacing: '0.04em', color: '#1e293b' }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handleCopy}
                            title="Copiar"
                          >
                            <i className={`bi bi-${copied ? 'check-lg text-success' : 'clipboard'}`} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={handleUseGenerated}
                          >
                            Usar
                          </button>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Pista: <strong className="text-dark">{generated.word1}</strong> + <strong className="text-dark">{generated.word2}</strong>
                        </span>
                      </>
                    ) : (
                      <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                        Hacé clic en <strong>Generar</strong> para obtener una contraseña segura.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                  : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
