import { api } from './api';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED'
  | 'BLOCKED';

export type PaymentStatus = 'PENDING' | 'PAID';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';

export interface AppointmentService {
  id: string;
  serviceId: string;
  price: number;
  durationMins: number;
  service: { id: string; name: string };
}

export interface AppointmentProduct {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; unit: string; type: string };
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
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  professional: { id: string; user: { name: string }; nickname: string | null };
  services: AppointmentService[];
  appointmentProducts: AppointmentProduct[];
  client: { name: string; phone: string | null } | null;
  clientSubscription: { id: string } | null;
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
  list: (params: { date?: string; dateFrom?: string; dateTo?: string; professionalId?: string; status?: string }) =>
    api.get<Appointment[]>('/api/appointments', { params }),

  create: (payload: CreateAppointmentPayload) =>
    api.post<Appointment>('/api/appointments', payload),

  updateStatus: (id: string, status: AppointmentStatus) =>
    api.patch<Appointment>(`/api/appointments/${id}/status`, { status }),

  availableSlots: (professionalId: string, date: string, durationMins: number) =>
    api.get<TimeSlot[]>('/api/appointments/available-slots', {
      params: { professionalId, date, durationMins },
    }),

  reschedule: (id: string, scheduledAt: string) =>
    api.patch<Appointment>(`/api/appointments/${id}/reschedule`, { scheduledAt }),

  resizeDuration: (id: string, durationMins: number) =>
    api.patch<Appointment>(`/api/appointments/${id}/duration`, { durationMins }),

  update: (id: string, payload: { clientId?: string; clientName?: string; notes?: string; serviceIds?: string[]; scheduledAt?: string; professionalId?: string }) =>
    api.patch<Appointment>(`/api/appointments/${id}`, payload),

  delete: (id: string) =>
    api.delete(`/api/appointments/${id}`),

  updatePayment: (id: string, paymentStatus: PaymentStatus, paymentMethod?: PaymentMethod) =>
    api.patch<Appointment>(`/api/appointments/${id}/payment`, { paymentStatus, paymentMethod }),

  addProduct: (id: string, productId: string, quantity: number) =>
    api.post<AppointmentProduct>(`/api/appointments/${id}/products`, { productId, quantity }),

  removeProduct: (id: string, itemId: string) =>
    api.delete(`/api/appointments/${id}/products/${itemId}`),
};
