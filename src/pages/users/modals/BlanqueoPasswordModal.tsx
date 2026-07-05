import { useState } from 'react';
import type { Usuario } from '../../../types';
import { userService } from '../../../services/userService';
import { passwordRules } from '../../../utils/passwordValidation';
import { generatePassword, type GeneratedPassword } from '../../../utils/passwordGenerator';
import toast from 'react-hot-toast';

interface Props {
  usuario: Usuario;
  onClose: () => void;
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
        <div className="progress-bar" style={{ width: `${percent}%`, background: color, transition: 'all 0.3s ease' }} />
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

export function BlanqueoPasswordModal({ usuario, onClose }: Props) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<GeneratedPassword | null>(null);
  const [copied, setCopied] = useState(false);

  const allRulesPassed = passwordRules.every((r) => r.test(passwordNueva));
  const confirmMatch = passwordNueva === confirmar;

  const handleGenerate = () => {
    setGenerated(generatePassword());
    setCopied(false);
  };

  const handleUseGenerated = () => {
    if (!generated) return;
    setPasswordNueva(generated.password);
    setConfirmar(generated.password);
    setShowPwd(true);
  };

  const handleCopy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRulesPassed) { setError('La contraseña no cumple los requisitos de seguridad'); return; }
    if (!confirmMatch) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await userService.blanquearPassword(usuario.id, passwordNueva);
      toast.success(`Contraseña de @${usuario.username} actualizada`);
      onClose();
    } catch {
      toast.error('Error al blanquear la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-key-fill text-warning" /> Blanquear Contraseña
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">
              <div className="alert alert-warning py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-1" />
                Estás por resetear la contraseña de <strong>@{usuario.username}</strong>.
              </div>

              {/* Nueva contraseña */}
              <div className="mb-3">
                <label className="form-label fw-semibold small">Nueva contraseña</label>
                <div className="input-group">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-control font-monospace"
                    value={passwordNueva}
                    onChange={(e) => { setPasswordNueva(e.target.value); setGenerated(null); }}
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
                </div>
                {passwordNueva && <PasswordStrengthPanel password={passwordNueva} />}
              </div>

              {/* Confirmar */}
              <div className="mb-3">
                <label className="form-label fw-semibold small">Confirmar contraseña</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`form-control font-monospace ${confirmar && !confirmMatch ? 'is-invalid' : ''}`}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                />
                {confirmar && !confirmMatch && (
                  <div className="invalid-feedback">Las contraseñas no coinciden</div>
                )}
              </div>

              {/* Contraseña sugerida */}
              <div className="mb-1">
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
                      <button type="button" className="btn btn-outline-secondary" onClick={handleCopy} title="Copiar">
                        <i className={`bi bi-${copied ? 'check-lg text-success' : 'clipboard'}`} />
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={handleUseGenerated}>
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

              {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                type="submit"
                className="btn btn-warning"
                disabled={saving || !allRulesPassed || !confirmMatch}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                  : <><i className="bi bi-key-fill me-1" />Blanquear</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
