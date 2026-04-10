const API_BASE = "http://127.0.0.1:8000";

let authToken: string | null = localStorage.getItem("farmdesk_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("farmdesk_token", token);
  else localStorage.removeItem("farmdesk_token");
}

export function getToken() {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    localStorage.removeItem("farmdesk_user");
    window.location.hash = "#/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// POS Sales
export const pos = {
  createSale: (data: any) =>
    request<any>("/pos/sales", { method: "POST", body: JSON.stringify(data) }),
  getSales: (pharmacyId: string, skip = 0, limit = 100) =>
    request<any[]>(`/pos/sales?pharmacy_id=${pharmacyId}&skip=${skip}&limit=${limit}`),
  getSale: (saleId: string) =>
    request<any>(`/pos/sales/${saleId}`),
  voidSale: (saleId: string) =>
    request<any>(`/pos/sales/${saleId}/void`, { method: "POST" }),
  dailyReport: (pharmacyId: string, date: string) =>
    request<any>(`/pos/report/daily?pharmacy_id=${pharmacyId}&date=${date}`),
  rangeReport: (pharmacyId: string, startDate: string, endDate: string) =>
    request<any[]>(`/pos/report/range?pharmacy_id=${pharmacyId}&start_date=${startDate}&end_date=${endDate}`),
};

// Inventory
export const inventory = {
  getBatches: (pharmacyId: string, medicineId?: string) => {
    let url = `/inventory/batches?pharmacy_id=${pharmacyId}`;
    if (medicineId) url += `&medicine_id=${medicineId}`;
    return request<any[]>(url);
  },
  receiveBatch: (data: any) =>
    request<any>("/inventory/batches", { method: "POST", body: JSON.stringify(data) }),
  updateBatch: (batchId: string, data: any) =>
    request<any>(`/inventory/batches/${batchId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getSummary: (pharmacyId: string) =>
    request<any[]>(`/inventory/summary?pharmacy_id=${pharmacyId}`),
  getAlerts: (pharmacyId: string) =>
    request<any[]>(`/inventory/alerts?pharmacy_id=${pharmacyId}`),
};

// Suppliers
export const suppliers = {
  list: () => request<any[]>("/suppliers/"),
  create: (data: any) =>
    request<any>("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/suppliers/${id}`, { method: "DELETE" }),
};

// Medicines (for POS product lookup)
export const medicines = {
  list: () => request<any[]>("/medicines/"),
  search: (q: string) => request<any[]>(`/medicines/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => request<any>(`/medicines/${id}`),
};

// Orders (online orders for pharmacy to process)
export const orders = {
  list: () => request<any[]>("/orders/"),
  updateStatus: (orderId: string, status: string) =>
    request<any>(`/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// Pharmacy
export const pharmacy = {
  get: (id: string) => request<any>(`/pharmacies/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/pharmacies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
