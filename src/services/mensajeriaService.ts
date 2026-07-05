import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { 
  ConversacionResumen, 
  ConversacionDetalle, 
  NuevaConversacionRequest, 
  ResponderConversacionRequest, 
  ActualizarEstadoRequest 
} from '../types';

export const mensajeriaService = {
  getBandeja: async (): Promise<ConversacionResumen[]> => {
    const res = await api.get<ConversacionResumen[]>(ENDPOINTS.mensajeria.bandeja);
    return res.data;
  },

  getConversacion: async (id: number): Promise<ConversacionDetalle> => {
    const res = await api.get<ConversacionDetalle>(ENDPOINTS.mensajeria.conversacion(id));
    return res.data;
  },

  crearConversacion: async (req: NuevaConversacionRequest): Promise<ConversacionResumen> => {
    const res = await api.post<ConversacionResumen>(ENDPOINTS.mensajeria.crear, req);
    return res.data;
  },

  responderConversacion: async (id: number, req: ResponderConversacionRequest): Promise<ConversacionDetalle> => {
    const res = await api.post<ConversacionDetalle>(ENDPOINTS.mensajeria.responder(id), req);
    return res.data;
  },

  actualizarEstado: async (id: number, req: ActualizarEstadoRequest): Promise<void> => {
    await api.patch(ENDPOINTS.mensajeria.estado(id), req);
  }
};
