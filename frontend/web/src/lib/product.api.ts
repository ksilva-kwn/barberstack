import { api } from './api';

export type ProductType = 'ESTOQUE' | 'BAR';

export interface Product {
  id: string;
  barbershopId: string;
  name: string;
  type: ProductType;
  description: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  minStockAlert: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentProduct {
  id: string;
  appointmentId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export const productApi = {
  list: (type?: ProductType, search?: string) =>
    api.get<Product[]>('/api/products', { params: { ...(type ? { type } : {}), ...(search ? { search } : {}) } }),

  create: (data: Partial<Product>) =>
    api.post<Product>('/api/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/api/products/${id}`, data),

  adjustStock: (id: string, delta: number) =>
    api.patch<Product>(`/api/products/${id}/stock`, { delta }),

  delete: (id: string) =>
    api.delete(`/api/products/${id}`),
};
