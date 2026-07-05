import React from 'react';
import { EstadoTablero, Prioridad } from '../../../../types';
import { useBoardStore } from '../../../../stores/boardStore';

interface Props {
  ticketId: number;
  titulo: string;
  estados: EstadoTablero[];
  activeEstadoId: number;
  activePrioridad: Prioridad;
  editingTitle: boolean;
  titleText: string;
  versionId?: number;
  onTitleTextChange: (v: string) => void;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onCancelEditTitle: () => void;
  onStateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPriorityChange: (p: Prioridad) => void;
  onClose: () => void;
  readOnly?: boolean;
  completado: boolean;
  onCompletadoChange: (c: boolean) => void;
}

const PRIORIDAD_OPTS = [
  { p: Prioridad.ALTA,  label: 'Alta',  active: 'bg-danger text-white',    inactive: 'btn-outline-danger' },
  { p: Prioridad.MEDIA, label: 'Media', active: 'bg-warning text-dark',    inactive: 'btn-outline-warning text-dark' },
  { p: Prioridad.BAJA,  label: 'Baja',  active: 'bg-success text-white',   inactive: 'btn-outline-success' },
] as const;

export const TicketHeader: React.FC<Props> = ({
  ticketId, titulo, estados, activeEstadoId, activePrioridad,
  editingTitle, titleText, versionId, onTitleTextChange,
  onStartEditTitle, onSaveTitle, onCancelEditTitle,
  onStateChange, onPriorityChange, onClose, readOnly,
  completado, onCompletadoChange,
}) => {
  const versions = useBoardStore((s) => s.versions);
  const versionTitle = versionId ? versions.find((v) => v.id === versionId)?.titulo : undefined;
  return (
  <>
    {/* Top bar: 3 columnas iguales — Estado | Prioridad (centrado) | Close */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '12px 20px 10px' }}>
      {/* Col 1: Estado */}
      <div>
        <select
          className="form-select form-select-sm border-0 fw-semibold text-secondary shadow-none"
          style={{ width: '160px', fontSize: '0.88rem', backgroundColor: 'var(--cpq-hover-bg)', borderRadius: '8px', padding: '5px 14px', cursor: readOnly ? 'default' : 'pointer' }}
          value={activeEstadoId}
          onChange={onStateChange}
          disabled={readOnly}
        >
          {estados.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {/* Col 2: Prioridad + Versión — centrado */}
      <div className="d-flex align-items-center gap-2">
        <span className="text-secondary fw-semibold" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Prioridad:</span>
        <div className="d-flex align-items-center gap-1">
          {PRIORIDAD_OPTS.map(({ p, label, active, inactive }) => (
            <button
              key={p}
              className={`btn btn-sm rounded-pill ${activePrioridad === p ? active : inactive}`}
              style={{ fontSize: '0.76rem', fontWeight: 600, padding: '3px 12px', lineHeight: 1.4 }}
              onClick={() => !readOnly && onPriorityChange(p)}
              disabled={readOnly}
            >
              {label}
            </button>
          ))}
        </div>
        {versionTitle && (
          <>
            <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0', margin: '0 6px' }} />
            <span
              className="badge d-inline-flex align-items-center gap-1"
              style={{ backgroundColor: '#7c3aed', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '8px' }}
              title={`Versión: ${versionTitle}`}
            >
              <i className="bi bi-tag-fill" style={{ fontSize: '0.7rem' }} />
              {versionTitle}
            </span>
          </>
        )}
      </div>

      {/* Col 3: Close — alineado a la derecha */}
      <div className="d-flex justify-content-end">
        <button type="button" className="btn-close shadow-none" onClick={onClose} />
      </div>
    </div>

    {/* Separador */}
    <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '4px' }} />

    {/* Title row */}
    <div className="d-flex align-items-start gap-2 px-4 pt-3 pb-2">
      {readOnly ? (
        <i
          className={`bi ${completado ? 'bi-check-circle-fill' : 'bi-circle'}`}
          style={{ fontSize: '1.45rem', color: completado ? '#68a623' : '#a1a1aa', marginTop: '2px' }}
        />
      ) : (
        <i
          className={`bi ${completado ? 'bi-check-circle-fill' : 'bi-circle'} cursor-pointer`}
          style={{ fontSize: '1.45rem', color: completado ? '#68a623' : '#a1a1aa', marginTop: '2px' }}
          onClick={() => onCompletadoChange(!completado)}
          title={completado ? 'Marcar como no completada' : 'Marcar como completada'}
        />
      )}
      <div className="flex-grow-1">
        <span className="badge bg-secondary mb-1" style={{ fontSize: '0.72rem' }}>#{ticketId}</span>
        {editingTitle && !readOnly ? (
          <div className="d-flex gap-2 mt-1">
            <input
              type="text"
              className="form-control form-control-sm fw-bold"
              value={titleText}
              onChange={(e) => onTitleTextChange(e.target.value)}
              autoFocus
            />
            <button className="btn btn-sm btn-primary" onClick={onSaveTitle}>Guardar</button>
            <button className="btn btn-sm btn-light" onClick={onCancelEditTitle}>Cancelar</button>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <h4
              className="fw-bold mb-0"
              style={{
                fontSize: '1.45rem',
                lineHeight: '1.4',
                cursor: readOnly ? 'default' : 'pointer',
                textDecoration: completado ? 'line-through' : 'none',
                color: completado ? 'var(--cpq-text-muted)' : 'var(--cpq-text-title)',
              }}
              onClick={() => !readOnly && onStartEditTitle()}
              title={readOnly ? undefined : 'Haz clic para editar título'}
            >
              {titulo}
            </h4>
            {!readOnly && (
              <i
                className="bi bi-pencil text-secondary"
                style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={onStartEditTitle}
                title="Editar título"
              />
            )}
          </div>
        )}
      </div>
    </div>
  </>
  );
};
