export interface Background {
  id: string;
  label: string;
  path: string;
}

export const BACKGROUNDS: Background[] = [
  { id: 'iguazu',          label: 'Cataratas del Iguazú',        path: '/backgrounds/iguazu.jpg' },
  { id: 'perito-moreno',   label: 'Glaciar Perito Moreno',       path: '/backgrounds/perito-moreno.jpg' },
  { id: 'fitz-roy',        label: 'Fitz Roy',                    path: '/backgrounds/fitz-roy.jpg' },
  { id: 'bariloche',       label: 'Bariloche',                   path: '/backgrounds/bariloche.jpg' },
  { id: 'angostura',       label: 'Villa La Angostura',          path: '/backgrounds/angostura.jpg' },
  { id: 'malvinas',        label: 'Islas Malvinas',              path: '/backgrounds/malvinas.jpg' },
  { id: 'purmamarca',      label: 'Cerro de los 7 Colores',      path: '/backgrounds/purmamarca.jpg' },
  { id: 'lanin',           label: 'Volcán Lanín',                path: '/backgrounds/lanin.jpg' },
  { id: 'zarate',          label: 'Puente Zárate – Brazo Largo', path: '/backgrounds/zarate.jpg' },
  { id: 'chaco-corrientes',label: 'Puente Chaco – Corrientes',   path: '/backgrounds/chaco-corrientes.jpg' },
];
