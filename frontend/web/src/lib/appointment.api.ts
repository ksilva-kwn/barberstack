import { api } from './api';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED'
  | 'BLOCKED';

export interface AppointmentService {
  id: string;
  serviceId: string;
  price: number;
  durationMins: number;
  service: { id: string; name: string };
}

export interface Appointment {
  id: string;
  barbershopId: string;
  professionalId: string;
  clientId: string | null;
  clientName: string | null;
  scheduledAt: string;
  durationMins: number;
  status: AppointmentStatus;
  origin: 'APP' | 'RECEPTION';
  notes: string | null;
  totalAmount: number;
  professional: { id: string; user: { name: string }; nickname: string | null };
  services: AppointmentService[];
  client: { name: string; phone: string | null } | null;
}

export interface CreateAppointmentPayload {
  professionalId: string;
  clientId?: string;
  clientName?: string;
  scheduledAt: string;
  serviceIds: string[];
  notes?: string;
  origin?: 'APP' | 'RECEPTION';
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const appointmentApi = {
  list: (params: { date?: string; professionalId?: string; status?: string }) =>
    api.get<Appointment[]>('/api/appointments', { params }),

  create: (payload: CreateAppointmentPayload) =>
    api.post<Appointment>('/api/appointments', payload),

  updateStatus: (id: string, status: AppointmentStatus) =>
    api.patch<Appointment>(`/api/appointments/${id}/status`, { status }),

  availableSlots: (professionalId: string, date: string, durationMins: number) =>
    api.get<TimeSlot[]>('/api/appointments/available-slots', {
      params: { professionalId, date, durationMins },
    }),
};
