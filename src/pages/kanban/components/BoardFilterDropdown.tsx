import React from 'react';
import { Etiqueta, Version } from '../../../types';
import { useAuthStore } from '../../../stores/authStore';

export interface FilterState {
  keyword: string;
  sinMiembros: boolean;
  tarjetasAsignadas: boolean;
  informadoPorMi: boolean;
  completadas: boolean;
  incompletas: boolean;
  sinVencimiento: boolean;
  vencidas: boolean;
  venceDiaSiguiente: boolean;
  venceSemanaSiguiente: boolean;
  venceMesSiguiente: boolean;
  sinEtiquetas: boolean;
  selectedEtiquetasIds: number[];
  sinVersion: boolean;
  selectedVersionIds: number[];
}

export const initialFilterState: FilterState = {
  keyword: '',
  sinMiembros: false,
  tarjetasAsignadas: false,
  informadoPorMi: false,
  completadas: false,
  incompletas: false,
  sinVencimiento: false,
  vencidas: false,
  venceDiaSiguiente: false,
  venceSemanaSiguiente: false,
  venceMesSiguiente: false,
  sinEtiquetas: false,
  selectedEtiquetasIds: [],
  sinVersion: false,
  selectedVersionIds: [],
};

interface BoardFilterDropdownProps {
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  onClose: () => void;
  etiquetas: Etiqueta[];
  versions: Version[];
}

export const BoardFilterDropdown: React.FC<BoardFilterDropdownProps> = ({
  filters,
  onChangeFilters,
  onClose,
  etiquetas,
  versions,
}) => {
  const { user: currentUser } = useAuthStore();

  const getInitials = (nombre: string) => {
    if (!nombre) return '';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const userInitials = currentUser ? getInitials(currentUser.nombreCompleto || currentUser.username || 'U') : 'U';
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, keyword: e.target.value });
  };

  const toggleCheckbox = (key: keyof FilterState) => {
    onChangeFilters({ ...filters, [key]: !filters[key] });
  };

  const toggleEtiqueta = (id: number) => {
    const exists = filters.selectedEtiquetasIds.includes(id);
    const updated = exists
      ? filters.selectedEtiquetasIds.filter((item) => item !== id)
      : [...filters.selectedEtiquetasIds, id];
    onChangeFilters({ ...filters, selectedEtiquetasIds: updated });
  };

  const toggleVersion = (id: number) => {
    const exists = filters.selectedVersionIds.includes(id);
    const updated = exists
      ? filters.selectedVersionIds.filter((item) => item !== id)
      : [...filters.selectedVersionIds, id];
    onChangeFilters({ ...filters, selectedVersionIds: updated });
  };

  const clearAll = () => {
    onChangeFilters(initialFilterState);
  };

  return (
    <div
      className="card shadow-lg border"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        width: '340px',
        maxHeight: '80vh',
        zIndex: 2000,
        borderRadius: '14px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-3"
      >
        <h6 className="mb-0 fw-bold text-center flex-grow-1" style={{ fontSize: '0.95rem', color: '#334155' }}>
          Filtrar
        </h6>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
            style={{ fontSize: '0.75rem' }}
            onClick={clearAll}
          >
            Limpiar
          </button>
          <button
            type="button"
            className="btn-close ms-1"
            style={{ fontSize: '0.8rem' }}
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body overflow-auto p-3" style={{ fontSize: '0.85rem' }}>
        {/* 1. Palabra clave */}
        <div className="mb-3">
          <label className="form-label fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
            Palabra clave
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Introduce una palabra clave..."
            value={filters.keyword}
            onChange={handleKeywordChange}
            style={{ borderRadius: '6px' }}
          />
          <div className="form-text mt-1" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Busca por título y descripción del ticket.
          </div>
        </div>

        {/* 2. Asignar */}
        <div className="mb-3">
          <label className="form-label fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
            Asignar
          </label>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-sinMiembros"
              checked={filters.sinMiembros}
              onChange={() => toggleCheckbox('sinMiembros')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-sinMiembros">
              <i className="bi bi-person text-secondary"></i> sin asignar
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-tarjetasAsignadas"
              checked={filters.tarjetasAsignadas}
              onChange={() => toggleCheckbox('tarjetasAsignadas')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-tarjetasAsignadas">
              <span
                className="badge rounded-circle d-inline-flex align-items-center justify-content-center border text-white"
                style={{
                  width: 20,
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: currentUser?.colorAvatar || '#3b82f6'
                }}
              >
                {userInitials}
              </span>
              Tarjetas asignadas a mí
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-informadoPorMi"
              checked={filters.informadoPorMi}
              onChange={() => toggleCheckbox('informadoPorMi')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-informadoPorMi">
              <i className="bi bi-eye" style={{ color: '#6366f1' }} /> Tarjetas en que soy informado
            </label>
          </div>
        </div>

        {/* 4. Vencimiento */}
        <div className="mb-3">
          <label className="form-label fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
            Vencimiento
          </label>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-sinVencimiento"
              checked={filters.sinVencimiento}
              onChange={() => toggleCheckbox('sinVencimiento')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-sinVencimiento">
              <i className="bi bi-calendar text-secondary"></i> Sin fecha de vencimiento
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-vencidas"
              checked={filters.vencidas}
              onChange={() => toggleCheckbox('vencidas')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-vencidas">
              <i className="bi bi-clock-fill text-danger"></i> Plazo vencido
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-venceDiaSiguiente"
              checked={filters.venceDiaSiguiente}
              onChange={() => toggleCheckbox('venceDiaSiguiente')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-venceDiaSiguiente">
              <i className="bi bi-clock-fill text-warning"></i> Vence el día siguiente
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2 mb-1">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-venceSemanaSiguiente"
              checked={filters.venceSemanaSiguiente}
              onChange={() => toggleCheckbox('venceSemanaSiguiente')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-venceSemanaSiguiente">
              <i className="bi bi-clock text-secondary"></i> Vence la semana siguiente
            </label>
          </div>
          <div className="form-check d-flex align-items-center gap-2">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-venceMesSiguiente"
              checked={filters.venceMesSiguiente}
              onChange={() => toggleCheckbox('venceMesSiguiente')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-venceMesSiguiente">
              <i className="bi bi-clock text-secondary"></i> Vence el mes siguiente
            </label>
          </div>
        </div>

        {/* 5. Etiquetas */}
        <div className="mb-3">
          <label className="form-label fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
            Etiquetas
          </label>
          <div className="form-check d-flex align-items-center gap-2 mb-2">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="filter-sinEtiquetas"
              checked={filters.sinEtiquetas}
              onChange={() => toggleCheckbox('sinEtiquetas')}
            />
            <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-sinEtiquetas">
              <i className="bi bi-tag text-secondary"></i> Sin etiquetas
            </label>
          </div>

          {etiquetas.map((tag) => {
            const isChecked = filters.selectedEtiquetasIds.includes(tag.id);
            return (
              <div key={tag.id} className="form-check d-flex align-items-center gap-2 mb-1">
                <input
                  className="form-check-input mt-0"
                  type="checkbox"
                  id={`filter-tag-${tag.id}`}
                  checked={isChecked}
                  onChange={() => toggleEtiqueta(tag.id)}
                />
                <label
                  className="form-check-label flex-grow-1 cursor-pointer rounded px-2 py-1 text-white fw-semibold"
                  htmlFor={`filter-tag-${tag.id}`}
                  style={{
                    backgroundColor: tag.colorHex ?? '#10b981',
                    fontSize: '0.78rem',
                  }}
                >
                  {tag.nombre}
                </label>
              </div>
            );
          })}
        </div>

        {/* 6. Versiones */}
        {versions.length > 0 && (
          <div>
            <label className="form-label fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#475569' }}>
              Versión
            </label>
            <div className="form-check d-flex align-items-center gap-2 mb-2">
              <input
                className="form-check-input mt-0"
                type="checkbox"
                id="filter-sinVersion"
                checked={filters.sinVersion}
                onChange={() => toggleCheckbox('sinVersion')}
              />
              <label className="form-check-label d-flex align-items-center gap-2 cursor-pointer" htmlFor="filter-sinVersion">
                <i className="bi bi-tag text-secondary"></i> Sin versión
              </label>
            </div>
            {versions.map((ver) => {
              const isChecked = filters.selectedVersionIds.includes(ver.id);
              return (
                <div key={ver.id} className="form-check d-flex align-items-center gap-2 mb-1">
                  <input
                    className="form-check-input mt-0"
                    type="checkbox"
                    id={`filter-ver-${ver.id}`}
                    checked={isChecked}
                    onChange={() => toggleVersion(ver.id)}
                  />
                  <label
                    className="form-check-label flex-grow-1 cursor-pointer d-flex align-items-center gap-1 rounded px-2 py-1 fw-semibold"
                    htmlFor={`filter-ver-${ver.id}`}
                    style={{ backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-tag-fill" style={{ fontSize: '0.7rem' }} />
                    {ver.titulo}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
