import React, { useState, useMemo } from 'react';
import { Version, VersionEstado, Etiqueta } from '../../../types';
import { GlassNavbar } from '../../../components/layout/GlassNavbar';
import { BoardFilterDropdown, FilterState, initialFilterState } from './BoardFilterDropdown';

type BoardView = 'board' | 'table' | 'calendar' | 'timeline' | 'summary';

interface Props {
  boardTitle?: string;
  imagenFondoUrl?: string;
  activeView: BoardView;
  onSetView: (view: BoardView) => void;
  loading: boolean;
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  etiquetas: Etiqueta[];
  versions: Version[];
  filterVersionEnCurso: boolean;
  onChangeFilterVersionEnCurso: (val: boolean) => void;
  versionEnCurso?: Version;
  onNewVersionClick: () => void;
  onNewMeetingClick: () => void;
  summaryMode: 'team' | 'mine';
  onChangeSummaryMode: (mode: 'team' | 'mine') => void;
  showCerradas: boolean;
  onToggleClosedVersions: () => void;
  showArchived: boolean;
  onToggleArchivedTickets: () => void;
  archivedLoading: boolean;
  showPlannerPanel: boolean;
  onTogglePlanner: () => void;
}

export const BoardNavbar: React.FC<Props> = ({
  boardTitle,
  imagenFondoUrl,
  activeView,
  onSetView,
  loading,
  filters,
  onChangeFilters,
  etiquetas,
  versions,
  filterVersionEnCurso,
  onChangeFilterVersionEnCurso,
  versionEnCurso,
  onNewVersionClick,
  onNewMeetingClick,
  summaryMode,
  onChangeSummaryMode,
  showCerradas,
  onToggleClosedVersions,
  showArchived,
  onToggleArchivedTickets,
  archivedLoading,
}) => {
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const viewInfo = {
    board:    { label: 'Tablero',   icon: 'bi-kanban' },
    table:    { label: 'Tabla',     icon: 'bi-table' },
    calendar: { label: 'Calendario', icon: 'bi-calendar3' },
    timeline: { label: 'Cronología', icon: 'bi-bar-chart-steps' },
    summary:  { label: 'Resumen',   icon: 'bi-pie-chart' },
  };

  const handleSetView = (view: BoardView) => {
    onSetView(view);
    setBoardDropdownOpen(false);
    setFilterOpen(false);
  };

  const isMyCardsActive = filters.tarjetasAsignadas;
  const handleToggleMyCards = () => {
    onChangeFilters({
      ...filters,
      tarjetasAsignadas: !filters.tarjetasAsignadas,
    });
  };

  // Badges calculation for filters
  const activeFilterBadges = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void; color?: string }[] = [];

    if (filterVersionEnCurso && versionEnCurso) {
      list.push({
        id: 'versionEnCurso',
        label: `Versión en curso: ${versionEnCurso.titulo}`,
        onRemove: () => onChangeFilterVersionEnCurso(false),
      });
    }

    if (filters.keyword.trim()) {
      list.push({
        id: 'keyword',
        label: `Palabra: "${filters.keyword}"`,
        onRemove: () => onChangeFilters({ ...filters, keyword: '' }),
      });
    }
    if (filters.sinMiembros) {
      list.push({
        id: 'sinMiembros',
        label: 'sin asignar',
        onRemove: () => onChangeFilters({ ...filters, sinMiembros: false }),
      });
    }
    if (filters.tarjetasAsignadas) {
      list.push({
        id: 'tarjetasAsignadas',
        label: 'Tarjetas asignadas a mí',
        onRemove: () => onChangeFilters({ ...filters, tarjetasAsignadas: false }),
      });
    }
    if (filters.informadoPorMi) {
      list.push({
        id: 'informadoPorMi',
        label: 'Tarjetas en que soy informado',
        onRemove: () => onChangeFilters({ ...filters, informadoPorMi: false }),
      });
    }
    if (filters.completadas) {
      list.push({
        id: 'completadas',
        label: 'Completadas',
        onRemove: () => onChangeFilters({ ...filters, completadas: false }),
      });
    }
    if (filters.incompletas) {
      list.push({
        id: 'incompletas',
        label: 'Incompletas',
        onRemove: () => onChangeFilters({ ...filters, incompletas: false }),
      });
    }
    if (filters.sinVencimiento) {
      list.push({
        id: 'sinVencimiento',
        label: 'Sin vencimiento',
        onRemove: () => onChangeFilters({ ...filters, sinVencimiento: false }),
      });
    }
    if (filters.vencidas) {
      list.push({
        id: 'vencidas',
        label: 'Plazo vencido',
        onRemove: () => onChangeFilters({ ...filters, vencidas: false }),
      });
    }
    if (filters.venceDiaSiguiente) {
      list.push({
        id: 'venceDiaSiguiente',
        label: 'Vence mañana',
        onRemove: () => onChangeFilters({ ...filters, venceDiaSiguiente: false }),
      });
    }
    if (filters.venceSemanaSiguiente) {
      list.push({
        id: 'venceSemanaSiguiente',
        label: 'Vence próxima semana',
        onRemove: () => onChangeFilters({ ...filters, venceSemanaSiguiente: false }),
      });
    }
    if (filters.venceMesSiguiente) {
      list.push({
        id: 'venceMesSiguiente',
        label: 'Vence próximo mes',
        onRemove: () => onChangeFilters({ ...filters, venceMesSiguiente: false }),
      });
    }
    if (filters.sinEtiquetas) {
      list.push({
        id: 'sinEtiquetas',
        label: 'Sin etiquetas',
        onRemove: () => onChangeFilters({ ...filters, sinEtiquetas: false }),
      });
    }
    if (filters.selectedEtiquetasIds.length > 0) {
      filters.selectedEtiquetasIds.forEach((tagId) => {
        const tag = etiquetas.find((e) => e.id === tagId);
        if (tag) {
          list.push({
            id: `tag-${tag.id}`,
            label: `Etiqueta: ${tag.nombre}`,
            onRemove: () =>
              onChangeFilters({
                ...filters,
                selectedEtiquetasIds: filters.selectedEtiquetasIds.filter((id) => id !== tagId),
              }),
          });
        }
      });
    }
    if (filters.sinVersion) {
      list.push({
        id: 'sinVersion',
        label: 'Sin versión',
        onRemove: () => onChangeFilters({ ...filters, sinVersion: false }),
      });
    }
    if (filters.selectedVersionIds.length > 0) {
      filters.selectedVersionIds.forEach((verId) => {
        const ver = versions.find((v) => v.id === verId);
        if (ver) {
          list.push({
            id: `ver-${ver.id}`,
            label: `Versión: ${ver.titulo}`,
            onRemove: () =>
              onChangeFilters({
                ...filters,
                selectedVersionIds: filters.selectedVersionIds.filter((id) => id !== verId),
              }),
          });
        }
      });
    }

    return list;
  }, [filters, etiquetas, versions, filterVersionEnCurso, versionEnCurso, onChangeFilters, onChangeFilterVersionEnCurso]);

  const leftContent = (
    <>
      <h4 className="fw-bold mb-0" style={{ color: 'var(--cpq-text-title)', fontSize: '1.35rem' }}>
        {boardTitle || 'Tablero de Tareas'}
      </h4>

      {/* Dropdown al lado del nombre del proyecto */}
      <div className="position-relative">
        <button
          className="btn cpq-navbar-btn"
          onClick={() => {
            const nextState = !boardDropdownOpen;
            setBoardDropdownOpen(nextState);
            if (nextState) setFilterOpen(false);
          }}
          title="Cambiar vista del tablero"
        >
          <i className={`bi ${viewInfo[activeView].icon} fs-6`}></i>
          <i className="bi bi-chevron-down" style={{ fontSize: '0.75rem' }}></i>
        </button>

        {boardDropdownOpen && (
          <div
            className="dropdown-menu show shadow-lg border position-absolute mt-1"
            style={{
              zIndex: 2000,
              minWidth: '190px',
              borderRadius: '12px',
              backgroundColor: 'var(--cpq-card-bg)',
              borderColor: 'var(--cpq-border-color)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h6 className="dropdown-header text-uppercase text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.5rem 1rem' }}>Vistas del Tablero</h6>
            <button
              className={`dropdown-item dropdown-menu-item d-flex align-items-center gap-2 ${activeView === 'board' ? 'active' : ''}`}
              onClick={() => handleSetView('board')}
            >
              <i className="bi bi-kanban"></i>
              <span>Tablero</span>
            </button>
            <button
              className={`dropdown-item dropdown-menu-item d-flex align-items-center gap-2 ${activeView === 'table' ? 'active' : ''}`}
              onClick={() => handleSetView('table')}
            >
              <i className="bi bi-table"></i>
              <span>Tabla</span>
            </button>
            <button
              className={`dropdown-item dropdown-menu-item d-flex align-items-center gap-2 ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => handleSetView('calendar')}
            >
              <i className="bi bi-calendar3"></i>
              <span>Calendario</span>
            </button>
            <button
              className={`dropdown-item dropdown-menu-item d-flex align-items-center gap-2 ${activeView === 'timeline' ? 'active' : ''}`}
              onClick={() => handleSetView('timeline')}
            >
              <i className="bi bi-bar-chart-steps"></i>
              <span>Cronología</span>
            </button>
            <button
              className={`dropdown-item dropdown-menu-item d-flex align-items-center gap-2 ${activeView === 'summary' ? 'active' : ''}`}
              onClick={() => handleSetView('summary')}
            >
              <i className="bi bi-pie-chart"></i>
              <span>Resumen</span>
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <GlassNavbar imagenFondoUrl={imagenFondoUrl} left={leftContent}>
          {loading && (
            <span className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true" />
          )}

          {/* Vista Tablero */}
          {activeView === 'board' && (
            <>
              <button
                className={`btn cpq-navbar-btn ${showArchived ? 'btn-yellow-active' : ''}`}
                onClick={onToggleArchivedTickets}
                disabled={archivedLoading}
              >
                <i className="bi bi-archive fs-5" />
                <span>Archivados</span>
              </button>

              {versionEnCurso && (
                <button
                  className={`btn cpq-navbar-btn ${filterVersionEnCurso ? 'btn-purple-active' : ''}`}
                  onClick={() => onChangeFilterVersionEnCurso(!filterVersionEnCurso)}
                >
                  <i className="bi bi-tag fs-5" />
                  <span>Versión en curso</span>
                </button>
              )}

              <button
                className={`btn cpq-navbar-btn ${isMyCardsActive ? 'btn-blue-active' : ''}`}
                onClick={handleToggleMyCards}
              >
                <i className="bi bi-person-badge fs-5" />
                <span>Mis tarjetas</span>
              </button>

              {/* Botón Filtro */}
              <div className="position-relative">
                <button
                  className={`btn cpq-navbar-btn ${filterOpen ? 'bg-white shadow' : ''}`}
                  onClick={() => {
                    const nextState = !filterOpen;
                    setFilterOpen(nextState);
                    if (nextState) setBoardDropdownOpen(false);
                  }}
                  title="Filtrar tarjetas"
                >
                  <i className="bi bi-list fs-5"></i>
                  <span>Filtrar</span>
                </button>

                {filterOpen && (
                  <BoardFilterDropdown
                    filters={filters}
                    onChangeFilters={onChangeFilters}
                    onClose={() => setFilterOpen(false)}
                    etiquetas={etiquetas}
                    versions={versions}
                  />
                )}
              </div>
            </>
          )}

          {/* Vista Tabla */}
          {activeView === 'table' && (
            <>
              <button className="btn cpq-navbar-btn" onClick={onNewVersionClick}>
                <i className="bi bi-plus-lg fs-5" />
                <span>Nueva Versión</span>
              </button>

              <button
                className={`btn cpq-navbar-btn ${showCerradas ? 'btn-purple-active' : ''}`}
                onClick={onToggleClosedVersions}
              >
                <i className="bi bi-tag-fill fs-5" />
                <span>Versiones cerradas ({versions.filter((v) => v.estado === VersionEstado.CERRADO).length})</span>
              </button>

              <button
                className={`btn cpq-navbar-btn ${isMyCardsActive ? 'btn-blue-active' : ''}`}
                onClick={handleToggleMyCards}
              >
                <i className="bi bi-person-badge fs-5" />
                <span>Mis tarjetas</span>
              </button>

              {/* Botón Filtro */}
              <div className="position-relative">
                <button
                  className={`btn cpq-navbar-btn ${filterOpen ? 'bg-white shadow' : ''}`}
                  onClick={() => {
                    const nextState = !filterOpen;
                    setFilterOpen(nextState);
                    if (nextState) setBoardDropdownOpen(false);
                  }}
                  title="Filtrar tarjetas"
                >
                  <i className="bi bi-list fs-5"></i>
                  <span>Filtrar</span>
                </button>

                {filterOpen && (
                  <BoardFilterDropdown
                    filters={filters}
                    onChangeFilters={onChangeFilters}
                    onClose={() => setFilterOpen(false)}
                    etiquetas={etiquetas}
                    versions={versions}
                  />
                )}
              </div>
            </>
          )}

          {/* Vista Calendario */}
          {activeView === 'calendar' && (
            <>
              <button className="btn cpq-navbar-btn" onClick={onNewMeetingClick}>
                <i className="bi bi-calendar-plus fs-5" />
                <span>Nueva reunión</span>
              </button>

              {versionEnCurso && (
                <button
                  className={`btn cpq-navbar-btn ${filterVersionEnCurso ? 'btn-purple-active' : ''}`}
                  onClick={() => onChangeFilterVersionEnCurso(!filterVersionEnCurso)}
                >
                  <i className="bi bi-tag fs-5" />
                  <span>Versión en curso</span>
                </button>
              )}

              <button
                className={`btn cpq-navbar-btn ${isMyCardsActive ? 'btn-blue-active' : ''}`}
                onClick={handleToggleMyCards}
              >
                <i className="bi bi-person-badge fs-5" />
                <span>Mis tarjetas</span>
              </button>
            </>
          )}

          {/* Vista Cronología */}
          {activeView === 'timeline' && (
            <>
              {versionEnCurso && (
                <button
                  className={`btn cpq-navbar-btn ${filterVersionEnCurso ? 'btn-purple-active' : ''}`}
                  onClick={() => onChangeFilterVersionEnCurso(!filterVersionEnCurso)}
                >
                  <i className="bi bi-tag fs-5" />
                  <span>Versión en curso</span>
                </button>
              )}

              <button
                className={`btn cpq-navbar-btn ${isMyCardsActive ? 'btn-blue-active' : ''}`}
                onClick={handleToggleMyCards}
              >
                <i className="bi bi-person-badge fs-5" />
                <span>Mis tarjetas</span>
              </button>
            </>
          )}

          {/* Vista Resumen */}
          {activeView === 'summary' && (
            <>
              <button
                className={`btn cpq-navbar-btn ${summaryMode === 'team' ? 'btn-blue-active' : ''}`}
                onClick={() => onChangeSummaryMode('team')}
              >
                <i className="bi bi-people-fill fs-5" />
                <span>Equipo</span>
              </button>
              <button
                className={`btn cpq-navbar-btn ${summaryMode === 'mine' ? 'btn-blue-active' : ''}`}
                onClick={() => onChangeSummaryMode('mine')}
              >
                <i className="bi bi-person-fill fs-5" />
                <span>Mis tareas</span>
              </button>
            </>
          )}
      </GlassNavbar>

      {/* Barra de Filtros Activos entre Navbar y Columnas */}
      {activeFilterBadges.length > 0 && activeView !== 'summary' && (
        <div className={`d-flex align-items-center gap-2 px-4 py-2 mx-3 mt-2 flex-wrap cpq-active-filters-bar ${imagenFondoUrl ? 'has-bg' : ''}`}>
          <span className="fw-semibold text-secondary small d-flex align-items-center gap-1">
            <i className="bi bi-funnel-fill text-primary"></i>
            Filtros activos:
          </span>
          {activeFilterBadges.map((b) => (
            <span
              key={b.id}
              className="badge d-inline-flex align-items-center gap-1 border shadow-sm"
              style={{
                fontSize: '0.75rem', padding: '5px 9px', borderRadius: '8px', fontWeight: 600,
                backgroundColor: b.color ? `${b.color}22` : 'var(--cpq-card-bg)',
                color: b.color ?? 'var(--cpq-text-primary)',
                borderColor: b.color ?? 'var(--cpq-border-color)',
              }}
            >
              {b.label}
              <i
                className="bi bi-x-lg ms-1 cursor-pointer"
                onClick={b.onRemove}
                style={{ fontSize: '0.65rem' }}
                title="Quitar filtro"
              ></i>
            </span>
          ))}
          <button
            className="btn btn-link btn-sm text-danger text-decoration-none ms-auto p-0 fw-semibold"
            style={{ fontSize: '0.75rem' }}
            onClick={() => { onChangeFilters(initialFilterState); onChangeFilterVersionEnCurso(false); }}
          >
            Limpiar todos
          </button>
        </div>
      )}
    </>
  );
};
