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

export interface ProductStats {
  totalProducts: number;
  totalStockValue: number;
  totalCostValue: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  deadStockCount: number;
  deadStock: { id: string; name: string; stock: number; unit: string }[];
  lowStockProducts: { id: string; name: string; stock: number; minStockAlert: number; unit: string }[];
  topSold: { productId: string; productName: string; totalQty: number; totalRevenue: number; unitPrice: number; unitCost: number }[];
  topByMargin: { productId: string; productName: string; totalQty: number; totalRevenue: number; margin: number; marginPct: number }[];
  totalRevenue: number;
  totalQtySold: number;
  revenueByMonth: { month: string; revenue: number; qty: number }[];
}

export const productApi = {
  list: (type?: ProductType, search?: string) =>
    api.get<Product[]>('/api/products', { params: { ...(type ? { type } : {}), ...(search ? { search } : {}) } }),

  stats: (type?: ProductType) =>
    api.get<ProductStats>('/api/products/stats', { params: type ? { type } : {} }),

  create: (data: Partial<Product>) =>
    api.post<Product>('/api/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/api/products/${id}`, data),

  adjustStock: (id: string, delta: number) =>
    api.patch<Product>(`/api/products/${id}/stock`, { delta }),

  delete: (id: string) =>
    api.delete(`/api/products/${id}`),
};
