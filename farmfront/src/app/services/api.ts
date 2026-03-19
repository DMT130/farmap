/**
 * FarmaMap — API Service Layer
 * =============================
 * Centralised HTTP client for all backend communication.
 * Switch BASE_URL to your production domain when deploying.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT token if available
  const token = localStorage.getItem("farmamap_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Type definitions (mirrors backend schemas)
// ---------------------------------------------------------------------------

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  district: string;
  rating: number;
  review_count: number;
  image: string | null;
  is_open: boolean;
  open_hours: string | null;
  phone: string | null;
  delivery_fee: number;
  delivery_time: string | null;
  distance: string | null;
}

export interface PriceRecord {
  pharmacy_id: string;
  medicine_id?: string;
  price: number;
  in_stock: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  description: string | null;
  requires_prescription: boolean;
  image: string | null;
  prices: PriceRecord[];
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  count: number;
}

export interface OrderItem {
  id: string;
  medicine_id: string;
  pharmacy_id: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  order_id: string;
  transaction_id: string | null;
  provider: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  delivery_address: string;
  delivery_method: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  payment: Payment | null;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  clinic: string | null;
  address: string | null;
  rating: number;
  review_count: number;
  image: string | null;
  consultation_fee: number;
  available_slots: string | null; // JSON string of time slots
}

export interface Appointment {
  id: string;
  user_id: string | null;
  doctor_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  role: string; // "customer" | "pharmacy_owner" | "admin"
  pharmacy_id: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    address?: string;
    role?: string;
    pharmacy_id?: string;
  }) => request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>(`/auth/me`),

  updateProfile: (userId: string, data: { full_name?: string; phone?: string; address?: string; role?: string; pharmacy_id?: string }) =>
    request<User>(`/auth/me`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccount: (userId: string) =>
    request<void>(`/auth/me`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Pharmacies
// ---------------------------------------------------------------------------

export const pharmaciesApi = {
  list: () => request<Pharmacy[]>("/pharmacies/"),
  get: (id: string) => request<Pharmacy>(`/pharmacies/${id}`),
  create: (data: Omit<Pharmacy, "id">) =>
    request<Pharmacy>("/pharmacies/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pharmacy>) =>
    request<Pharmacy>(`/pharmacies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/pharmacies/${id}`, { method: "DELETE" }),
  // Per-pharmacy medicine prices
  listPrices: (pharmacyId: string) =>
    request<PriceRecord[]>(`/pharmacies/${pharmacyId}/prices`),
  upsertPrice: (pharmacyId: string, data: { medicine_id: string; price: number; in_stock: boolean }) =>
    request<PriceRecord>(`/pharmacies/${pharmacyId}/prices`, { method: "PUT", body: JSON.stringify(data) }),
  deletePrice: (pharmacyId: string, medicineId: string) =>
    request<void>(`/pharmacies/${pharmacyId}/prices/${medicineId}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Medicines
// ---------------------------------------------------------------------------

export const medicinesApi = {
  list: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<Medicine[]>(`/medicines/${params}`);
  },
  get: (id: string) => request<Medicine>(`/medicines/${id}`),
  search: (params: {
    q?: string;
    category?: string;
    in_stock_only?: boolean;
    no_prescription?: boolean;
    sort_by?: string;
  }) =>
    request<Medicine[]>("/medicines/search", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  create: (data: any) =>
    request<Medicine>("/medicines/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Medicine>) =>
    request<Medicine>(`/medicines/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/medicines/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesApi = {
  list: () => request<Category[]>("/categories/"),
  create: (data: { name: string; icon?: string; count?: number }) =>
    request<Category>("/categories/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersApi = {
  create: (data: {
    user_id?: string;
    items: { medicine_id: string; pharmacy_id: string; quantity: number; price: number }[];
    delivery_address: string;
    delivery_method: string;
    payment_method: string;
    total_amount: number;
  }) => request<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }),

  get: (id: string) => request<Order>(`/orders/${id}`),
  list: () => request<Order[]>("/orders/"),
  userOrders: (userId: string) => request<Order[]>(`/orders/user/${userId}`),
  updateStatus: (id: string, status: string) =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const paymentsApi = {
  process: (data: {
    order_id: string;
    provider: string;
    amount: number;
    transaction_id?: string;
  }) =>
    request<Payment>("/payments/process", { method: "POST", body: JSON.stringify(data) }),

  getForOrder: (orderId: string) => request<Payment>(`/payments/order/${orderId}`),
};

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export const appointmentsApi = {
  doctors: () => request<Doctor[]>("/appointments/doctors"),
  createDoctor: (data: Omit<Doctor, "id">) =>
    request<Doctor>("/appointments/doctors", { method: "POST", body: JSON.stringify(data) }),
  updateDoctor: (id: string, data: Partial<Doctor>) =>
    request<Doctor>(`/appointments/doctors/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDoctor: (id: string) =>
    request<void>(`/appointments/doctors/${id}`, { method: "DELETE" }),
  book: (data: { user_id?: string; doctor_id: string; date: string; time: string }) =>
    request<Appointment>("/appointments/", { method: "POST", body: JSON.stringify(data) }),
  userAppointments: (userId: string) =>
    request<Appointment[]>(`/appointments/user/${userId}`),
  list: () => request<Appointment[]>("/appointments/"),
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  cancel: (id: string) =>
    request<Appointment>(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    }),
  delete: (id: string) =>
    request<void>(`/appointments/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  /** List all users (admin only) */
  listUsers: () => request<User[]>("/auth/users"),

  /** Update any user's role / pharmacy_id */
  updateUser: (userId: string, data: { role?: string; pharmacy_id?: string | null; full_name?: string }) =>
    request<User>(`/auth/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ---------------------------------------------------------------------------
// Helper: format Mozambican Metical
// ---------------------------------------------------------------------------

export function formatMZN(value: number): string {
  return `${value.toFixed(0)} MT`;
}
