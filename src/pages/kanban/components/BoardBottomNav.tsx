import React from 'react';

type BoardView = 'board' | 'table' | 'calendar' | 'timeline' | 'summary';

interface Props {
  activeView: BoardView;
  onSetView: (view: BoardView) => void;
}

export const BoardBottomNav: React.FC<Props> = ({ activeView, onSetView }) => {
  return (
    <div
      className="position-fixed start-50 translate-middle-x"
      style={{
        bottom: '24px',
        zIndex: 99,
        pointerEvents: 'auto'
      }}
    >
      <div className="bottom-nav-container d-flex align-items-center gap-2">
        <button
          className={`bottom-nav-btn border-0 ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => onSetView('board')}
        >
          <i className="bi bi-kanban fs-5"></i>
          <span>Tablero</span>
        </button>

        <div className="vr text-muted my-1" style={{ height: '20px' }} />

        <button
          className={`bottom-nav-btn border-0 ${activeView === 'table' ? 'active' : ''}`}
          onClick={() => onSetView('table')}
        >
          <i className="bi bi-table fs-5"></i>
          <span>Tabla</span>
        </button>

        <div className="vr text-muted my-1" style={{ height: '20px' }} />

        <button
          className={`bottom-nav-btn border-0 ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => onSetView('calendar')}
        >
          <i className="bi bi-calendar3 fs-5"></i>
          <span>Calendario</span>
        </button>

        <div className="vr text-muted my-1" style={{ height: '20px' }} />

        <button
          className={`bottom-nav-btn border-0 ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => onSetView('timeline')}
        >
          <i className="bi bi-bar-chart-steps fs-5"></i>
          <span>Cronología</span>
        </button>

        <div className="vr text-muted my-1" style={{ height: '20px' }} />

        <button
          className={`bottom-nav-btn border-0 ${activeView === 'summary' ? 'active' : ''}`}
          onClick={() => onSetView('summary')}
        >
          <i className="bi bi-pie-chart fs-5"></i>
          <span>Resumen</span>
        </button>
      </div>
    </div>
  );
};
