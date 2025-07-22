// API Types based on the Go backend models

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  description?: string;
  created_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone_number?: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
  product_id: number;
  quantity: number;
}

export interface Sale {
  id: number;
  user_id: number;
  customer_id?: number;
  total_amount: number;
  final_amount: number;
  payment_method: string;
  transaction_time: string;
  items?: SaleItem[];
}

export interface SalesReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_transactions: number;
  top_selling_products: {
    product_id: number;
    product_name: string;
    total_sold: number;
    total_value: number;
  }[];
}

export interface CreateSaleRequest {
  user_id: number;
  customer_id?: number;
  payment_method: string;
  items: SaleItem[];
  discount_codes?: string[];
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone_number?: string;
  email?: string;
  address?: string;
}

export interface RegisterUserRequest {
  username: string;
  password: string;
  role?: string;
}

export type PaymentMethod = 'cash' | 'credit_card';
