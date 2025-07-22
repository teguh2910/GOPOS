import {
  Product,
  Customer,
  User,
  Sale,
  SalesReport,
  CreateSaleRequest,
  CreateProductRequest,
  CreateCustomerRequest,
  RegisterUserRequest,
} from '@/types';

const API_BASE_URL = '/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(errorText || 'Request failed', response.status);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) return {} as T;
      
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error occurred', 500);
    }
  }

  // Products API
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: Partial<CreateProductRequest>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers API
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(customer: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: number, customer: Partial<CreateCustomerRequest>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: number): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales API
  async createSale(sale: CreateSaleRequest): Promise<{ sale_id: number }> {
    return this.request<{ sale_id: number }>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async getSales(): Promise<Sale[]> {
    return this.request<Sale[]>('/sales');
  }

  async getSale(id: number): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  // Users API
  async registerUser(user: RegisterUserRequest): Promise<{ user_id: number }> {
    return this.request<{ user_id: number }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports API
  async getSalesReport(startDate?: string, endDate?: string): Promise<SalesReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<SalesReport>(`/reports/sales${query}`);
  }
}

// Custom error class
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiService();
export { ApiError };
