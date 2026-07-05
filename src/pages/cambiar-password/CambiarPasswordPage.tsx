import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { userService } from '../../services/userService';
import { passwordRules, validatePassword } from '../../utils/passwordValidation';
import toast from 'react-hot-toast';

export function CambiarPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'GT | Cambiar contraseña';
    return () => { document.title = 'GT | GestorTareas'; };
  }, []);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validation = validatePassword(passwordNueva);
  const confirmMatch = passwordNueva === confirmar;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!passwordActual) errs.actual = 'Ingresá tu contraseña actual';
    if (!validation.valid) errs.nueva = 'La contraseña no cumple los requisitos de seguridad';
    if (!confirmar) errs.confirmar = 'Confirmá la nueva contraseña';
    else if (!confirmMatch) errs.confirmar = 'Las contraseñas no coinciden';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await userService.cambiarPassword(passwordActual, passwordNueva);
      toast.success('Contraseña actualizada correctamente');
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmar('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('incorrecta') || msg.includes('401') || msg.includes('400')) {
        setErrors(p => ({ ...p, actual: 'La contraseña actual es incorrecta' }));
      } else {
        toast.error('Error al cambiar la contraseña');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cpq-layout">
      <Sidebar onSelectBoard={(id) => navigate(`/kanban/${id}`)} />

      <div className="cpq-content">
        <div className="cpq-navbar d-flex align-items-center">
          <h5 className="fw-bold mb-0" style={{ color: 'var(--cpq-primary)' }}>
            <i className="bi bi-shield-lock-fill me-2 text-primary"></i>Cambiar Contraseña
          </h5>
        </div>

        <div className="flex-grow-1 d-flex align-items-start justify-content-center p-4 overflow-auto">
          <div className="card border-0 shadow-sm w-100" style={{ maxWidth: 460 }}>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} noValidate>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Contraseña actual</label>
                  <input
                    type="password"
                    className={`form-control ${errors.actual ? 'is-invalid' : ''}`}
                    value={passwordActual}
                    onChange={e => setPasswordActual(e.target.value)}
                    autoComplete="current-password"
                  />
                  {errors.actual && <div className="invalid-feedback">{errors.actual}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold small">Nueva contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.nueva ? 'is-invalid' : ''}`}
                    value={passwordNueva}
                    onChange={e => setPasswordNueva(e.target.value)}
                    autoComplete="new-password"
                  />
                  {errors.nueva && <div className="invalid-feedback">{errors.nueva}</div>}
                </div>

                {/* Indicador visual de requisitos */}
                {passwordNueva && (
                  <ul className="list-unstyled small mb-3 ps-1">
                    {passwordRules.map(rule => (
                      <li key={rule.label} className={rule.test(passwordNueva) ? 'text-success' : 'text-danger'}>
                        <i className={`bi ${rule.test(passwordNueva) ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`} />
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmar ? 'is-invalid' : confirmar && confirmMatch ? 'is-valid' : ''}`}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                  />
                  {errors.confirmar
                    ? <div className="invalid-feedback">{errors.confirmar}</div>
                    : confirmar && confirmMatch && <div className="valid-feedback">Las contraseñas coinciden</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</>
                    : <><i className="bi bi-shield-check me-1" />Cambiar contraseña</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
