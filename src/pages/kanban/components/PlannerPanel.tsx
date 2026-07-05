import React from 'react';
import toast from 'react-hot-toast';

interface Props {
  show: boolean;
  onClose: () => void;
}

export const PlannerPanel: React.FC<Props> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="cpq-planner-panel cpq-planner-panel-style d-flex flex-column shadow-sm animate__animated animate__slideInLeft">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i className="bi bi-calendar-event text-primary"></i>
          Planificador
        </h5>
        <button
          className="btn btn-sm btn-link text-secondary p-0 border-0 bg-transparent"
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-6"></i>
        </button>
      </div>

      <div className="d-flex gap-3 flex-grow-1" style={{ minHeight: '350px' }}>
        {/* Hours column */}
        <div className="d-flex flex-column justify-content-between text-muted border-end pe-2" style={{ fontSize: '0.75rem', width: '50px' }}>
          <div>09:00</div>
          <div>10:00</div>
          <div>11:00</div>
          <div>12:00</div>
          <div>13:00</div>
          <div>14:00</div>
          <div>15:00</div>
          <div>16:00</div>
          <div>17:00</div>
          <div>18:00</div>
        </div>

        {/* Connection Promo Card */}
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-3 bg-light rounded-3 border" style={{ minHeight: '300px' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-microsoft text-primary fs-3" title="Outlook Calendar"></i>
            <i className="bi bi-plus-lg text-muted"></i>
            <i className="bi bi-google text-danger fs-3" title="Google Calendar"></i>
          </div>
          <h6 className="fw-bold mb-2">Conectá tus calendarios</h6>
          <p className="text-secondary small mb-3">
            Conectá tus calendarios para ver lado a lado el Planificador y tus tareas por hacer.
          </p>
          <button
            className="btn btn-sm btn-primary px-3 mb-3 fw-semibold"
            style={{ borderRadius: '20px' }}
            onClick={() => toast('Integración de calendarios en desarrollo')}
          >
            Conectar una cuenta
          </button>
          <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-lock-fill"></i>
            <span>Solo tú puedes ver tu planificador.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
