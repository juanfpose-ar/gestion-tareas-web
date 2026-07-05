import type { Usuario } from '../../../types';

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#212529' : '#ffffff';
}

interface Props {
  users: Usuario[];
  onClose: () => void;
  onEdit: (usuario: Usuario) => void;
}

export function InactiveUsersPanel({ users, onClose, onEdit }: Props) {
  return (
    <div className="cpq-inactive-users-panel d-flex flex-column shadow-sm flex-shrink-0">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i className="bi bi-person-x-fill text-secondary"></i>
          Usuarios Inactivos ({users.length})
        </h6>
        <button
          className="btn btn-sm btn-link text-secondary p-0 border-0 bg-transparent"
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-6"></i>
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-muted small fst-italic mb-0 text-center py-4">No hay usuarios inactivos.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="d-flex align-items-center justify-content-between p-2 rounded-2 border bg-light"
            >
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{
                    width: 30, height: 30, fontSize: '0.75rem',
                    background: u.colorAvatar ?? '#0d6efd',
                    color: contrastColor(u.colorAvatar ?? '#0d6efd'),
                    opacity: 0.6,
                  }}
                >
                  {(u.nombreCompleto || u.username).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-truncate">
                  <div className="fw-semibold small text-truncate">@{u.username}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                    {u.nombreCompleto ?? '—'}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm flex-shrink-0"
                onClick={() => onEdit(u)}
                title="Editar / reactivar usuario"
              >
                <i className="bi bi-pencil-fill" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
