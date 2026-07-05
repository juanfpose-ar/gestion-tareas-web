import React, { useMemo } from 'react';
import { Ticket, EstadoTablero, Etiqueta, Version } from '../../../types';

interface Props {
  tickets: Ticket[];
  estados: EstadoTablero[];
  etiquetas: Etiqueta[];
  onOpenTicket: (ticket: Ticket) => void;
  mode?: 'team' | 'mine';
  currentUserId?: number;
  versionEnCurso?: Version;
}

const DONE_KW = ['hecho', 'terminado', 'done', 'finalizado', 'completado', 'cerrado', 'listo', 'resuelto', 'resolved', 'closed', 'finished'];

const P_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  ALTA:  { color: '#dc2626', bg: '#fee2e2', label: 'Alta' },
  MEDIA: { color: '#d97706', bg: '#fef3c7', label: 'Media' },
  BAJA:  { color: '#16a34a', bg: '#dcfce7', label: 'Baja' },
};

const STATE_PALETTE = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} minuto${mins !== 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}

function initials(name: string): string {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export const BoardSummary: React.FC<Props> = ({ tickets, estados, etiquetas, onOpenTicket, mode = 'team', currentUserId, versionEnCurso }) => {
  const now = useMemo(() => Date.now(), []);
  const sevenAgo  = now - 7 * 86400000;
  const sevenAhead = now + 7 * 86400000;

  const scopedTickets = useMemo(() => {
    if (mode !== 'mine' || currentUserId == null) return tickets;
    return tickets.filter(t =>
      t.creadorId === currentUserId ||
      t.asignadosCard?.some(a => a.id === currentUserId) ||
      t.asignados?.some(a => a.id === currentUserId)
    );
  }, [tickets, mode, currentUserId]);

  /* ── Metrics ── */
  const finalizadas = useMemo(() =>
    scopedTickets.filter(t => {
      const n = (t.estadoNombre ?? '').toLowerCase();
      return DONE_KW.some(kw => n.includes(kw)) && t.fechaModificacion && new Date(t.fechaModificacion).getTime() >= sevenAgo;
    }).length, [scopedTickets, sevenAgo]);

  const actualizadas = useMemo(() =>
    scopedTickets.filter(t => t.fechaModificacion && new Date(t.fechaModificacion).getTime() >= sevenAgo).length,
    [scopedTickets, sevenAgo]);

  const creadas = useMemo(() =>
    scopedTickets.filter(t => t.fechaCreacion && new Date(t.fechaCreacion).getTime() >= sevenAgo).length,
    [scopedTickets, sevenAgo]);

  const vencenPronto = useMemo(() =>
    scopedTickets.filter(t => {
      if (!t.fechaVencimiento) return false;
      const d = new Date(t.fechaVencimiento).getTime();
      return d >= now && d <= sevenAhead;
    }).length, [scopedTickets, now, sevenAhead]);

  /* ── Status donut ── */
  const statusData = useMemo(() =>
    estados
      .map((e, i) => ({
        id: e.id,
        nombre: e.nombre,
        color: e.colorHex || STATE_PALETTE[i % STATE_PALETTE.length],
        count: scopedTickets.filter(t => t.estadoId === e.id).length,
      }))
      .filter(s => s.count > 0),
    [scopedTickets, estados]);

  const total = scopedTickets.length;
  const r = 70; const cx = 100; const cy = 100;
  const circ = 2 * Math.PI * r;

  const donutSegs = useMemo(() => {
    let cum = 0;
    return statusData.map(s => {
      const arc = total > 0 ? (s.count / total) * circ : 0;
      const offset = cum;
      cum += arc;
      return { ...s, arc, offset };
    });
  }, [statusData, total, circ]);

  /* ── Recent activity ── */
  const recent = useMemo(() =>
    [...scopedTickets]
      .filter(t => t.fechaModificacion)
      .sort((a, b) => new Date(b.fechaModificacion!).getTime() - new Date(a.fechaModificacion!).getTime())
      .slice(0, 12),
    [scopedTickets]);

  /* ── Priority ── */
  const priCounts = useMemo(() =>
    (['ALTA', 'MEDIA', 'BAJA'] as const).map(p => ({
      key: p,
      ...P_CONFIG[p],
      count: scopedTickets.filter(t => t.prioridad === p).length,
    })),
    [scopedTickets]);
  const maxPri = Math.max(...priCounts.map(p => p.count), 1);

  /* ── Labels ── */
  const labelData = useMemo(() =>
    etiquetas
      .map(etq => ({
        ...etq,
        count: scopedTickets.filter(t => t.etiquetas?.some(e => e.id === etq.id)).length,
      }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    [scopedTickets, etiquetas]);

  /* ── Workload ── */
  const workload = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; color: string; count: number }>();
    scopedTickets.forEach(t => {
      const assignees = (t.asignadosCard ?? t.asignados?.map(u => ({
        id: u.id, username: u.username, nombreCompleto: u.nombreCompleto, colorAvatar: u.colorAvatar,
      })) ?? []) as { id: number; username: string; nombreCompleto?: string; colorAvatar?: string }[];
      assignees.forEach(a => {
        const prev = map.get(a.id);
        if (prev) prev.count++;
        else map.set(a.id, { id: a.id, nombre: a.nombreCompleto || a.username, color: a.colorAvatar || '#6366f1', count: 1 });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [scopedTickets]);
  const maxWork = Math.max(...workload.map(w => w.count), 1);

  /* ── Version en curso ── */
  const versionTickets = useMemo(() => {
    if (!versionEnCurso) return [];
    return tickets.filter(t => t.versionId === versionEnCurso.id && !t.archivado);
  }, [tickets, versionEnCurso]);

  const myVersionTickets = useMemo(() => {
    if (!versionEnCurso || currentUserId == null) return [];
    return versionTickets.filter(t =>
      t.asignadosCard?.some(a => a.id === currentUserId) ||
      t.asignados?.some(a => a.id === currentUserId) ||
      t.creadorId === currentUserId
    );
  }, [versionTickets, currentUserId, versionEnCurso]);

  const versionDaysLeft = useMemo(() => {
    if (!versionEnCurso?.fechaVencimiento) return null;
    return Math.ceil((new Date(versionEnCurso.fechaVencimiento).getTime() - Date.now()) / 86400000);
  }, [versionEnCurso]);

  const versionStatusBreakdown = useMemo(() => {
    const base = mode === 'mine' ? myVersionTickets : versionTickets;
    return estados
      .map((e, i) => ({
        id: e.id,
        nombre: e.nombre,
        color: e.colorHex || STATE_PALETTE[i % STATE_PALETTE.length],
        count: base.filter(t => t.estadoId === e.id).length,
        isDone: DONE_KW.some(kw => e.nombre.toLowerCase().includes(kw)),
      }))
      .filter(s => s.count > 0);
  }, [versionTickets, myVersionTickets, estados, mode]);

  const versionAssignees = useMemo(() => {
    if (mode === 'mine') return [];
    const map = new Map<number, { id: number; nombre: string; color: string; done: number; total: number }>();
    versionTickets.forEach(t => {
      const isDone = DONE_KW.some(kw => (t.estadoNombre ?? '').toLowerCase().includes(kw));
      const assignees = (t.asignadosCard ?? t.asignados?.map(u => ({
        id: u.id, username: u.username, nombreCompleto: u.nombreCompleto, colorAvatar: u.colorAvatar,
      })) ?? []) as { id: number; username: string; nombreCompleto?: string; colorAvatar?: string }[];
      assignees.forEach(a => {
        const prev = map.get(a.id);
        if (prev) { prev.total++; if (isDone) prev.done++; }
        else map.set(a.id, { id: a.id, nombre: a.nombreCompleto || a.username, color: a.colorAvatar || '#6366f1', done: isDone ? 1 : 0, total: 1 });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [versionTickets, mode]);

  /* ── Card style ── */
  const card = { background: 'rgba(255,255,255,0.92)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', padding: '16px 20px' };
  const sectionTitle = { fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 };

  const metrics = [
    { label: 'Finalizadas',   value: finalizadas,   icon: 'bi-check-circle-fill', color: '#16a34a', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', sub: 'últimos 7 días' },
    { label: 'Actualizadas',  value: actualizadas,  icon: 'bi-pencil-fill',        color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', sub: 'últimos 7 días' },
    { label: 'Creadas',       value: creadas,        icon: 'bi-plus-circle-fill',   color: '#6366f1', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', sub: 'últimos 7 días' },
    { label: 'Vencen pronto', value: vencenPronto,  icon: 'bi-clock-fill',         color: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', sub: 'próximos 7 días' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4px 2px 32px' }}>

      {/* ── Versión en curso ── */}
      {versionEnCurso && (() => {
        const base = mode === 'mine' ? myVersionTickets : versionTickets;
        const doneCount = base.filter(t => DONE_KW.some(kw => (t.estadoNombre ?? '').toLowerCase().includes(kw))).length;
        const pct = base.length > 0 ? Math.round(doneCount / base.length * 100) : 0;
        const overdue = versionDaysLeft !== null && versionDaysLeft < 0;
        const daysLabel = versionDaysLeft === null ? null
          : versionDaysLeft === 0 ? 'Vence hoy'
          : overdue ? `Vencida hace ${Math.abs(versionDaysLeft)} día${Math.abs(versionDaysLeft) !== 1 ? 's' : ''}`
          : `${versionDaysLeft} día${versionDaysLeft !== 1 ? 's' : ''} restante${versionDaysLeft !== 1 ? 's' : ''}`;

        return (
          <div className="mb-4" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%), #ffffff',
            border: '1.5px solid rgba(99,102,241,0.22)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '20px 24px',
          }}>
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-tag-fill" style={{ color: '#6366f1', fontSize: '1rem' }} />
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>{versionEnCurso.titulo}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', borderRadius: 20, padding: '2px 10px' }}>En curso</span>
                {mode === 'mine' && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderRadius: 20, padding: '2px 10px' }}>Mi progreso</span>}
              </div>
              <div className="ms-auto d-flex align-items-center gap-3 flex-wrap">
                {daysLabel && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: overdue ? '#dc2626' : '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className={`bi ${overdue ? 'bi-exclamation-triangle-fill' : 'bi-calendar3'}`} style={{ color: overdue ? '#dc2626' : '#64748b' }} />
                    {daysLabel}
                    {versionEnCurso.fechaVencimiento && (
                      <span style={{ color: '#64748b', fontWeight: 400 }}>
                        · {new Date(versionEnCurso.fechaVencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                  {doneCount}/{base.length} completados
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 500 }}>Progreso general</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pct === 100 ? '#16a34a' : '#6366f1' }}>{pct}%</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct === 100 ? '#16a34a' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 10,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* Estado breakdown + assignees */}
            <div className="d-flex gap-4 flex-wrap">
              <div className="d-flex flex-wrap gap-2">
                {versionStatusBreakdown.map(s => (
                  <span key={s.id} style={{
                    fontSize: '0.72rem', fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                    background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}40`,
                  }}>
                    {s.nombre}: {s.count}
                  </span>
                ))}
              </div>
              {mode === 'team' && versionAssignees.length > 0 && (
                <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Asignados:</span>
                  {versionAssignees.map(a => (
                    <span key={a.id} className="d-flex align-items-center gap-1" title={`${a.nombre}: ${a.done}/${a.total}`}>
                      <span
                        className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle flex-shrink-0"
                        style={{ width: 22, height: 22, fontSize: '0.52rem', backgroundColor: a.color }}
                      >
                        {initials(a.nombre)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>{a.done}/{a.total}</span>
                    </span>
                  ))}
                </div>
              )}
              {mode === 'mine' && myVersionTickets.length > 0 && (
                <div className="ms-auto d-flex flex-column gap-1" style={{ minWidth: 240, maxWidth: 400 }}>
                  {myVersionTickets.slice(0, 4).map(t => {
                    const isDone = DONE_KW.some(kw => (t.estadoNombre ?? '').toLowerCase().includes(kw));
                    const stateColor = estados.find(e => e.id === t.estadoId)?.colorHex || '#94a3b8';
                    return (
                      <div
                        key={t.id}
                        className="d-flex align-items-center gap-2"
                        style={{ cursor: 'pointer', opacity: isDone ? 0.6 : 1 }}
                        onClick={() => onOpenTicket(t)}
                      >
                        <i className={`bi ${isDone ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{ color: isDone ? '#16a34a' : '#cbd5e1', fontSize: '0.75rem', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: '#334155', flex: 1, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#6366f1', fontWeight: 700, marginRight: 4 }}>#{t.id}</span>{t.titulo}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: stateColor, fontWeight: 600, flexShrink: 0 }}>{t.estadoNombre}</span>
                      </div>
                    );
                  })}
                  {myVersionTickets.length > 4 && (
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', paddingLeft: 18 }}>+{myVersionTickets.length - 4} más</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Metric cards ── */}
      <div className="row g-3 mb-3">
        {metrics.map(m => (
          <div key={m.label} className="col-6 col-lg-3">
            <div style={{ ...card, background: m.bg, border: '1.5px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', height: '100%' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{m.label}</span>
                <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: '1rem' }} />
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status donut + Recent activity ── */}
      <div className="row g-3 mb-3">
        <div className="col-md-5">
          <div style={card}>
            <div style={sectionTitle}><i className="bi bi-pie-chart me-2" />Resumen de Estado</div>
            {total === 0 ? (
              <p className="text-muted fst-italic small mb-0">Sin tickets en el tablero.</p>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <svg viewBox="0 0 200 200" width={160} height={160} style={{ flexShrink: 0 }}>
                  {donutSegs.map((s, i) => (
                    <circle
                      key={i} cx={cx} cy={cy} r={r}
                      fill="none" stroke={s.color} strokeWidth={32}
                      strokeDasharray={`${s.arc} ${circ - s.arc}`}
                      strokeDashoffset={-s.offset}
                      transform={`rotate(-90,${cx},${cy})`}
                    />
                  ))}
                  <text x={cx} y={cy - 9} textAnchor="middle" fontSize="26" fontWeight="800" fill="#1e293b">{total}</text>
                  <text x={cx} y={cy + 11} textAnchor="middle" fontSize="10" fill="#94a3b8">tickets</text>
                </svg>
                <div className="d-flex flex-column gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                  {statusData.map(s => (
                    <div key={s.id} className="d-flex align-items-center gap-2">
                      <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                      <span className="text-truncate" style={{ fontSize: '0.75rem', color: '#475569', flex: 1 }}>{s.nombre}</span>
                      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>{s.count}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0 }}>({Math.round(s.count / total * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <div style={{ ...card, height: '100%' }}>
            <div style={sectionTitle}><i className="bi bi-activity me-2" />Actividad Reciente</div>
            {recent.length === 0 ? (
              <p className="text-muted fst-italic small mb-0">Sin actividad reciente registrada.</p>
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recent.map(t => {
                  const actorNombre = t.ultimoModificadoPorNombre ?? t.creadorNombre ?? 'Desconocido';
                  const actorColor  = t.ultimoModificadoPorColorAvatar ?? t.creadorColorAvatar ?? '#6366f1';
                  return (
                    <div
                      key={t.id}
                      className="d-flex align-items-start gap-2 p-2 rounded-3"
                      style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                      onClick={() => onOpenTicket(t)}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 rounded-circle"
                        style={{ width: 28, height: 28, fontSize: '0.62rem', backgroundColor: actorColor, marginTop: 1 }}
                      >
                        {initials(actorNombre)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.79rem', color: '#334155', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700 }}>{actorNombre}</span>
                          {' actualizó '}
                          <span style={{ color: '#6366f1', fontWeight: 700 }}>#{t.id}</span>
                          {' '}
                          <span style={{ color: '#475569' }}>{t.titulo}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                          {t.fechaModificacion ? relativeTime(t.fechaModificacion) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Priority + Labels + Workload ── */}
      <div className="row g-3">
        <div className="col-md-3">
          <div style={{ ...card, height: '100%' }}>
            <div style={sectionTitle}><i className="bi bi-bar-chart-fill me-2" />Desglose de Prioridad</div>
            <div className="d-flex align-items-end justify-content-around" style={{ height: 148 }}>
              {priCounts.map(p => (
                <div key={p.key} className="d-flex flex-column align-items-center gap-1" style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{p.count}</span>
                  <div style={{ width: 36, height: 116, backgroundColor: '#f1f5f9', borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', margin: '0 auto' }}>
                    <div style={{
                      width: '100%',
                      height: `${(p.count / maxPri) * 100}%`,
                      backgroundColor: p.color,
                      transition: 'height 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: p.color, textAlign: 'center' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={mode === 'mine' ? 'col-md-9' : 'col-md-5'}>
          <div style={{ ...card, height: '100%' }}>
            <div style={sectionTitle}><i className="bi bi-tags-fill me-2" />Desglose por Etiquetas</div>
            {labelData.length === 0 ? (
              <p className="text-muted fst-italic small mb-0">Sin etiquetas asignadas a tickets.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {labelData.map(etq => (
                  <div key={etq.id}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: etq.colorHex || '#6366f1', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500 }}>{etq.nombre}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>
                        {etq.count} ({total > 0 ? Math.round(etq.count / total * 100) : 0}%)
                      </span>
                    </div>
                    <div style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${total > 0 ? (etq.count / total) * 100 : 0}%`,
                        backgroundColor: etq.colorHex || '#6366f1',
                        borderRadius: 10,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {mode !== 'mine' && (
          <div className="col-md-4">
            <div style={{ ...card, height: '100%' }}>
              <div style={sectionTitle}><i className="bi bi-people-fill me-2" />Carga de Trabajo del Equipo</div>
              {workload.length === 0 ? (
                <p className="text-muted fst-italic small mb-0">Sin usuarios asignados a tickets.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {workload.map(m => (
                    <div key={m.id}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span
                          className="d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 rounded-circle"
                          style={{ width: 24, height: 24, fontSize: '0.58rem', backgroundColor: m.color }}
                        >
                          {initials(m.nombre)}
                        </span>
                        <span className="text-truncate" style={{ fontSize: '0.79rem', color: '#334155', fontWeight: 600, flex: 1 }}>{m.nombre}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>{m.count}</span>
                      </div>
                      <div style={{ height: 5, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(m.count / maxWork) * 100}%`,
                          backgroundColor: m.color,
                          borderRadius: 10,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
