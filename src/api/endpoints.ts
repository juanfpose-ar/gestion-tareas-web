/**
 * Todos los endpoints del sistema en un único lugar.
 * Los métodos que reciben ID devuelven el path completo.
 */
export const ENDPOINTS = {
  auth: {
    login:            '/auth/login',
    logout:           '/auth/logout',
    me:               '/auth/me',
    profile:          '/auth/profile',
    cambiarPassword:  '/auth/cambiar-password',
  },

  tableros: {
    list:             '/tableros',
    adminTodos:       '/tableros/admin/todos',
    byId:      (id: number) => `/tableros/${id}`,
    archivar:  (id: number) => `/tableros/${id}/archivar`,
    miembros:  (id: number) => `/tableros/${id}/miembros`,
  },

  estados: {
    byTablero: (tableroId: number) => `/estados/tablero/${tableroId}`,
    create:           '/estados',
    update:    (id: number) => `/estados/${id}`,
    delete:    (id: number) => `/estados/${id}`,
  },

  tickets: {
    byTablero:          (tableroId: number) => `/tickets/tablero/${tableroId}`,
    archivadosByTablero:(tableroId: number) => `/tickets/tablero/${tableroId}/archivados`,
    byVersion:          (versionId: number) => `/tickets/version/${versionId}`,
    byId:      (id: number)        => `/tickets/${id}`,
    create:           '/tickets',
    update:    (id: number) => `/tickets/${id}`,
    cambiarEstado: (id: number) => `/tickets/${id}/estado`,
    archivar:      (id: number) => `/tickets/${id}/archivar`,
    cambiarCompletado: (id: number) => `/tickets/${id}/completado`,
    reordenarEnEstado: (estadoId: number) => `/tickets/estado/${estadoId}/reordenar`,
    delete:        (id: number) => `/tickets/${id}`,

    // Sub-recursos del ticket
    checklist:       (ticketId: number)             => `/tickets/${ticketId}/checklist`,
    checklistItem:   (ticketId: number, itemId: number) => `/tickets/${ticketId}/checklist/${itemId}`,
    checklistToggle:    (ticketId: number, itemId: number) => `/tickets/${ticketId}/checklist/${itemId}/toggle`,
    checklistReordenar: (ticketId: number)                => `/tickets/${ticketId}/checklist/reordenar`,

    notas:     (ticketId: number)             => `/tickets/${ticketId}/notas`,
    nota:      (ticketId: number, id: number) => `/tickets/${ticketId}/notas/${id}`,

    recordatorios:   (ticketId: number)             => `/tickets/${ticketId}/recordatorios`,
    recordatorio:    (ticketId: number, id: number) => `/tickets/${ticketId}/recordatorios/${id}`,

    adjuntos:        (ticketId: number)             => `/tickets/${ticketId}/adjuntos`,
    adjuntoArchivo:  (ticketId: number)             => `/tickets/${ticketId}/adjuntos/archivo`,
    adjuntoEnlace:   (ticketId: number)             => `/tickets/${ticketId}/adjuntos/enlace`,
    adjunto:         (ticketId: number, id: number) => `/tickets/${ticketId}/adjuntos/${id}`,

    asignar:    (ticketId: number, usuarioId: number) => `/tickets/${ticketId}/asignados/${usuarioId}`,
    desasignar: (ticketId: number, usuarioId: number) => `/tickets/${ticketId}/asignados/${usuarioId}`,

    asignarInformado:    (ticketId: number, usuarioId: number) => `/tickets/${ticketId}/informados/${usuarioId}`,
    desasignarInformado: (ticketId: number, usuarioId: number) => `/tickets/${ticketId}/informados/${usuarioId}`,
  },

  etiquetas: {
    byTablero: (tableroId: number) => `/etiquetas/tablero/${tableroId}`,
    globales:         '/etiquetas/globales',
    create:           '/etiquetas',
    update:    (id: number) => `/etiquetas/${id}`,
    delete:    (id: number) => `/etiquetas/${id}`,
  },

  usuarios: {
    list:                '/usuarios',
    create:              '/usuarios',
    update:     (id: number) => `/usuarios/${id}`,
    toggleActivo: (id: number) => `/usuarios/${id}/activo`,
    blanquearPassword: (id: number) => `/usuarios/${id}/blanquear-password`,
  },

  vinculos: {
    byTicket: (ticketId: number) => `/vinculos/ticket/${ticketId}`,
    create:   '/vinculos',
    delete:   (id: number) => `/vinculos/${id}`,
  },

  versiones: {
    byTablero: (tableroId: number) => `/tableros/${tableroId}/versiones`,
    create:    '/versiones',
    update:    (id: number) => `/versiones/${id}`,
    delete:    (id: number) => `/versiones/${id}`,
  },

  reuniones: {
    byTablero: (tableroId: number) => `/tableros/${tableroId}/reuniones`,
    create:    '/reuniones',
    update:    (id: number) => `/reuniones/${id}`,
    delete:    (id: number) => `/reuniones/${id}`,
  },

  mensajeria: {
    bandeja:          '/mensajeria/bandeja',
    conversacion: (id: number) => `/mensajeria/conversaciones/${id}`,
    crear:            '/mensajeria/conversaciones',
    responder:    (id: number) => `/mensajeria/conversaciones/${id}/responder`,
    estado:       (id: number) => `/mensajeria/conversaciones/${id}/estado`,
  },
};
