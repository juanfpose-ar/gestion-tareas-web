import React, { useState } from 'react';

interface DeleteColumnModalProps {
  nombre: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteColumnModal: React.FC<DeleteColumnModalProps> = ({
  nombre,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold text-dark">Eliminar Columna</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body py-3">
            <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>
              ¿Estás seguro de que querés eliminar la columna <strong className="text-dark">"{nombre}"</strong>? Esta acción eliminará la lista del tablero.
            </p>
          </div>
          <div className="modal-footer border-top-0 pt-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger px-4" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar Columna'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
