import React, { useState, useRef, useEffect } from 'react';
import { Reunion, Ticket } from '../../../types';
import { reunionService, ReunionRequest } from '../../../services/reunionService';

interface Props {
  tableroId: number;
  tickets: Ticket[];
  initialDate?: Date;
  reunion?: Reunion;
  onClose: () => void;
  onSaved: () => void;
}

const COLOR_PRESETS = [
  { hex: '#ef4444', label: 'Rojo' },
  { hex: '#ff6b6b', label: 'Coral' },
  { hex: '#f59e0b', label: 'Naranja' },
  { hex: '#eab308', label: 'Amarillo' },
  { hex: '#84cc16', label: 'Limón' },
  { hex: '#10b981', label: 'Esmeralda' },
  { hex: '#14b8a6', label: 'Turquesa' },
  { hex: '#8b5cf6', label: 'Violeta' },
  { hex: '#d946ef', label: 'Fucsia' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#b45309', label: 'Café' },
  { hex: '#64748b', label: 'Gris' },
];

const RECORDATORIO_OPTS = [
  { value: undefined, label: 'Sin recordatorio' },
  { value: 5,    label: '5 minutos antes' },
  { value: 15,   label: '15 minutos antes' },
  { value: 30,   label: '30 minutos antes' },
  { value: 60,   label: '1 hora antes' },
  { value: 120,  label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
];

const P_COLOR: Record<string, string> = {
  ALTA: '#dc2626', MEDIA: '#d97706', BAJA: '#16a34a', URGENTE: '#9333ea',
};

const dateToStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const ReunionModal: React.FC<Props> = ({ tableroId, tickets, initialDate, reunion, onClose, onSaved }) => {
  const isEdit = !!reunion;

  const [titulo, setTitulo] = useState(reunion?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(reunion?.descripcion ?? '');
  const [fecha, setFecha] = useState(reunion?.fecha ?? (initialDate ? dateToStr(initialDate) : ''));
  const [horaInicio, setHoraInicio] = useState(reunion?.horaInicio ?? '');
  const [horaFin, setHoraFin] = useState(reunion?.horaFin ?? '');
  const [color, setColor] = useState(reunion?.color ?? '#8b5cf6');
  const [recordatorioMinutos, setRecordatorioMinutos] = useState<number | undefined>(reunion?.recordatorioMinutos);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>(reunion?.ticketIds ?? []);
  const [ticketSearch, setTicketSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const activeTickets = tickets.filter((t) => !t.archivado);
  const filteredTickets = ticketSearch.trim()
    ? activeTickets.filter((t) =>
        t.titulo.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        String(t.id).includes(ticketSearch)
      )
    : activeTickets;

  const toggleTicket = (id: number) =>
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (!titulo.trim()) { setError('El título es obligatorio.'); return; }
    if (!fecha) { setError('La fecha es obligatoria.'); return; }
    setLoading(true);
    setError('');
    try {
      const req: ReunionRequest = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha,
        horaInicio: horaInicio || undefined,
        horaFin: horaFin || undefined,
        color,
        recordatorioMinutos,
        tableroId,
        ticketIds: selectedTicketIds,
      };
      if (isEdit && reunion) {
        await reunionService.actualizar(reunion.id, req);
      } else {
        await reunionService.crear(req);
      }
      onSaved();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reunion || !window.confirm(`¿Eliminar la reunión "${reunion.titulo}"?`)) return;
    setLoading(true);
    try {
      await reunionService.eliminar(reunion.id);
      onSaved();
    } catch {
      setError('Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-calendar-event-fill" style={{ color }} />
              {isEdit ? 'Editar reunión' : 'Nueva reunión'}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body px-4 py-3">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            {/* Color */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Color</label>
              <div className="d-flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.hex)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: color === c.hex ? '3px solid #1e293b' : '2px solid transparent',
                      cursor: 'pointer', outline: 'none', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Título */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Título</label>
              <input
                className="form-control"
                placeholder="Ej: Reunión de equipo, Llamada con cliente..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                autoFocus
              />
            </div>

            {/* Fecha */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Fecha</label>
              <input
                type="date"
                className="form-control"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            {/* Horario */}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Horario (opcional)</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="time"
                  className="form-control"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
                <span className="text-muted fw-semibold">→</span>
                <input
                  type="time"
                  className="form-control"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            {/* Recordatorio */}
            <div className="mb-3">
              <label className="form-label fw-semibold small d-flex align-items-center gap-1">
                <i className="bi bi-bell text-warning" />
                Recordatorio
              </label>
              <select
                className="form-select"
                value={recordatorioMinutos ?? ''}
                onChange={(e) => setRecordatorioMinutos(e.target.value === '' ? undefined : Number(e.target.value))}
              >
                {RECORDATORIO_OPTS.map((opt) => (
                  <option key={opt.value ?? 'none'} value={opt.value ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tickets vinculados */}
            <div className="mb-1">
              <label className="form-label fw-semibold small d-flex align-items-center justify-content-between">
                <span className="d-flex align-items-center gap-1">
                  <i className="bi bi-ticket-perforated text-primary" />
                  Tickets vinculados
                </span>
                {selectedTicketIds.length > 0 && (
                  <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.72rem' }}>
                    {selectedTicketIds.length} seleccionados
                  </span>
                )}
              </label>
              <input
                ref={searchRef}
                className="form-control form-control-sm mb-2"
                placeholder="Buscar ticket..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 0' }}>
                {filteredTickets.length === 0 ? (
                  <p className="text-muted text-center small py-3 mb-0">Sin resultados.</p>
                ) : filteredTickets.map((t) => {
                  const checked = selectedTicketIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`d-flex align-items-center gap-2 px-3 py-2 ${checked ? 'bg-light' : ''}`}
                      style={{ cursor: 'pointer', margin: 0 }}
                      onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input mt-0 flex-shrink-0"
                        checked={checked}
                        onChange={() => toggleTicket(t.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="badge bg-secondary" style={{ fontSize: '0.7rem', minWidth: 30 }}>#{t.id}</span>
                      <span className="flex-grow-1 text-truncate" style={{ fontSize: '0.85rem' }} title={t.titulo}>
                        {t.titulo}
                      </span>
                      <span style={{ color: P_COLOR[t.prioridad] ?? '#64748b', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>
                        {t.prioridad}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-3">
              <label className="form-label fw-semibold small">Descripción (opcional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Agenda, notas, link de videollamada..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer border-0 px-4 pb-4 pt-2 d-flex justify-content-between">
            <div>
              {isEdit && (
                <button className="btn btn-outline-danger btn-sm" onClick={handleDelete} disabled={loading}>
                  <i className="bi bi-trash me-1" />Eliminar
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary fw-semibold" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? <span className="spinner-border spinner-border-sm me-1" />
                  : <i className="bi bi-check-lg me-1" />}
                {isEdit ? 'Guardar cambios' : 'Crear reunión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
