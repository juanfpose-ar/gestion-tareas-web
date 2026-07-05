import React from 'react';
import { Recordatorio, TipoRecordatorio } from '../../../../types';

interface Props {
  recordatorios: Recordatorio[];
  showCustomRec: boolean;
  customRecFecha: string;
  onCustomRecFechaChange: (v: string) => void;
  onToggleCustomRec: () => void;
  onTogglePreset: (tipo: TipoRecordatorio) => void;
  onAddCustom: () => void;
  onDelete: (id: number) => void;
}

export const RecordatoriosSection: React.FC<Props> = ({
  recordatorios, showCustomRec, customRecFecha,
  onCustomRecFechaChange, onToggleCustomRec,
  onTogglePreset, onAddCustom, onDelete,
}) => {
  const hasPreset = (tipo: TipoRecordatorio) =>
    recordatorios.some((r) => (r.tipo || r.tipoRecordatorio || '').toUpperCase() === tipo.toUpperCase());

  return (
    <div id="sec-recordatorios" className="mb-4">
      <div className="fw-bold text-uppercase text-dark mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
        <i className="bi bi-bell me-1" /> RECORDATORIOS
      </div>

      <div className="d-flex flex-column gap-2 mb-2">
        {recordatorios.map((r) => (
          <div key={r.id} className="d-flex justify-content-between align-items-center p-2 rounded bg-light" style={{ fontSize: '0.875rem' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-bell text-warning" />
              <span>
                {r.mensaje || (r.fechaPersonalizada
                  ? new Date(r.fechaPersonalizada).toLocaleString()
                  : r.fechaHora
                  ? new Date(r.fechaHora).toLocaleString()
                  : (r.tipo || 'Recordatorio'))}
              </span>
            </div>
            <button className="btn btn-sm text-secondary border-0 p-0" onClick={() => onDelete(r.id)}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center">
        {[
          { tipo: TipoRecordatorio.DIA_ANTES, label: '1 día antes' },
          { tipo: TipoRecordatorio.HORA_ANTES, label: '1 hora antes' },
        ].map(({ tipo, label }) => (
          <button
            key={tipo}
            className={`btn btn-sm rounded-2 px-3 py-1 d-flex align-items-center gap-1 ${hasPreset(tipo) ? 'bg-success text-white border-success' : 'btn-outline-secondary'}`}
            style={{ fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => onTogglePreset(tipo)}
          >
            <i className="bi bi-bell" /> {label}
          </button>
        ))}
        {(() => {
          const hasCustom = hasPreset(TipoRecordatorio.PERSONALIZADO);
          return (
            <button
              className={`btn btn-sm rounded-2 px-3 py-1 d-flex align-items-center gap-1 ${hasCustom ? 'bg-success text-white border-success' : showCustomRec ? 'bg-secondary text-white border-secondary' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.82rem', fontWeight: 600, opacity: hasCustom ? 0.6 : 1, cursor: hasCustom ? 'not-allowed' : 'pointer' }}
              onClick={() => { if (!hasCustom) onToggleCustomRec(); }}
              title={hasCustom ? 'Eliminá el recordatorio personalizado actual para agregar uno nuevo' : ''}
            >
              <i className="bi bi-clock" /> Personalizado
            </button>
          );
        })()}
      </div>

      {showCustomRec && (
        <div className="d-flex gap-2 mt-2 align-items-center">
          <input
            type="datetime-local"
            className="form-control form-control-sm"
            style={{ width: '240px' }}
            value={customRecFecha}
            onChange={(e) => onCustomRecFechaChange(e.target.value)}
          />
          <button
            className="btn btn-sm text-white px-3"
            style={{ backgroundColor: '#e91e63' }}
            onClick={onAddCustom}
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
};
