import React from 'react';

interface Props {
  left: React.ReactNode;
  imagenFondoUrl?: string;
  children?: React.ReactNode;
}

export const GlassNavbar: React.FC<Props> = ({ left, imagenFondoUrl, children }) => (
  <div className={`cpq-navbar cpq-navbar-glass d-flex justify-content-between align-items-center px-4 py-3 mx-3 mt-3 mb-1 ${imagenFondoUrl ? 'has-bg' : ''}`}>
    <div className="d-flex align-items-center gap-3 position-relative">
      {left}
    </div>
    <div className="d-flex align-items-center gap-2 position-relative">
      {children}
    </div>
  </div>
);
