export enum Rol {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA'
}

export enum TipoAdjunto {
  IMAGEN = 'IMAGEN',
  DOCUMENTO = 'DOCUMENTO',
  OTRO = 'OTRO'
}

export enum TipoRecordatorio {
  DIA_ANTES = 'DIA_ANTES',
  HORA_ANTES = 'HORA_ANTES',
  PERSONALIZADO = 'PERSONALIZADO'
}

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto?: string;
  nombre?: string;
  email?: string;
  colorAvatar?: string;
  rol: Rol;
  activo?: boolean;
  tablerosIds?: number[];
}


export interface LoginResponse {
  token: string;
  id?: number;
  username?: string;
  nombreCompleto?: string;
  rol?: Rol;
  usuario?: Usuario;
}


export interface Tablero {
  id: number;
  titulo: string;
  descripcion?: string;
  imagenFondoUrl?: string;
  archivado?: boolean;
  creadorId?: number;
  miembros?: Usuario[];
}

export interface EstadoTablero {
  id: number;
  nombre: string;
  orden: number;
  colorHex?: string;
  tableroId?: number;
}

export interface Etiqueta {
  id: number;
  nombre: string;
  colorHex?: string;
  colorTexto?: string;
  tableroId?: number;
}

export interface ChecklistItem {
  id: number;
  texto?: string;
  contenido?: string;
  completado: boolean;
  ticketId?: number;
}

export interface NotaTarea {
  id: number;
  contenido: string;
  fechaCreacion?: string;
  autorUsername?: string;
  ticketId: number;
}

export interface Recordatorio {
  id: number;
  tipo?: TipoRecordatorio;
  tipoRecordatorio?: TipoRecordatorio;
  fechaPersonalizada?: string;
  fechaHora?: string;
  mensaje?: string;
  notificado?: boolean;
  completado?: boolean;
  ticketId?: number;
}

export interface Adjunto {
  id: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoAdjunto: TipoAdjunto;
  tamanioBytes?: number;
  ticketId: number;
  fechaCreacion?: string;
  url?: string;
}

export interface VinculoDTO {
  id: number;
  ticketOrigenId: number;
  ticketOrigenTitulo?: string;
  ticketDestinoId: number;
  ticketDestinoTitulo?: string;
  tipoVinculo: string;
  fechaCreacion?: string;
}

export interface AsignadoCard {
  id: number;
  username: string;
  nombreCompleto?: string;
  colorAvatar?: string;
}

export interface Ticket {
  id: number;
  orden?: number;
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  tableroId: number;
  estadoId: number;
  estadoNombre?: string;
  estadoColorHex?: string;
  archivado: boolean;
  completado?: boolean;
  fechaArchivado?: string;
  fechaVencimiento?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  etiquetas?: Etiqueta[];
  vinculos?: VinculoDTO[];
  checklist?: ChecklistItem[];
  adjuntos?: Adjunto[];
  cantidadAdjuntos?: number;
  cantidadVinculos?: number;
  cantidadNotas?: number;
  cantidadRecordatorios?: number;
  checklistTotal?: number;
  checklistCompletados?: number;
  notas?: NotaTarea[];
  asignados?: Usuario[];
  asignadosCard?: AsignadoCard[];
  asignadoId?: number;
  versionId?: number;
  informados?: Usuario[];
  cantidadInformados?: number;
  informadosIds?: number[];
  creadorId?: number;
  creadorNombre?: string;
  creadorColorAvatar?: string;
  ultimoModificadoPorNombre?: string;
  ultimoModificadoPorColorAvatar?: string;
}

export interface TicketRequest {
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  tableroId: number;
  estadoId: number;
  etiquetasIds?: number[];
  fechaVencimiento?: string;
  fechaModificacion?: string;
  completado?: boolean;
}

export enum VersionEstado {
  POR_HACER = 'POR_HACER',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  CERRADO = 'CERRADO',
}

export interface Version {
  id: number;
  titulo: string;
  fechaVencimiento: string;
  tableroId: number;
  ticketIds: number[];
  estado: VersionEstado;
}

export interface ConversacionResumen {
  id: number;
  asunto: string;
  ultimoEmisorId?: number;
  ultimoEmisorNombre?: string;
  fragmentoUltimoMensaje?: string;
  totalMensajes: number;
  tieneNoLeidos: boolean;
  fechaUltimaActividad: string;
  archivada: boolean;
  nombresParticipantes: string;
  destacada: boolean;
}

export interface Mensaje {
  id: number;
  emisorId: number;
  emisorNombre: string;
  contenido: string;
  fechaEnvio: string;
}

export interface ConversacionDetalle {
  id: number;
  asunto: string;
  fechaUltimaActividad: string;
  mensajes: Mensaje[];
  participanteIds: number[];
}

export interface NuevaConversacionRequest {
  asunto: string;
  contenido: string;
  destinatarioIds: number[];
}

export interface ResponderConversacionRequest {
  contenido: string;
}

export interface ActualizarEstadoRequest {
  archivada?: boolean;
  eliminada?: boolean;
  leida?: boolean;
  destacada?: boolean;
}

export interface Reunion {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string;
  horaFin?: string;
  color?: string;
  recordatorioMinutos?: number;
  tableroId: number;
  ticketIds?: number[];
}
