import { z } from 'zod';
import { Prioridad } from '../types';

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const tableroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export const estadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido (ej: #3b82f6)'),
  orden: z.number().min(1, 'El orden debe ser mayor a 0'),
});

export const etiquetaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido (ej: #3b82f6)'),
  esGlobal: z.boolean(),
});

export const ticketSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  prioridad: z.nativeEnum(Prioridad),
  estadoId: z.number({ message: 'Seleccioná un estado' }).min(1),
  etiquetasIds: z.array(z.number()).optional(),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo letras, números, puntos, guiones y guión bajo'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100, 'Máximo 100 caracteres'),
  nombreCompleto: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type TableroFormData = z.infer<typeof tableroSchema>;
export type EstadoFormData = z.infer<typeof estadoSchema>;
export type EtiquetaFormData = z.infer<typeof etiquetaSchema>;
export type TicketFormData = z.infer<typeof ticketSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
