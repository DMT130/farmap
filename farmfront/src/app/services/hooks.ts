/**
 * FarmaMap — React data hooks
 * =============================
 * Custom hooks that fetch data from the backend API.
 * Each hook returns { data, loading, error } to keep pages thin.
 * Falls back to mock-data when the API is unreachable so the
 * frontend still works standalone during development.
 */

import { useState, useEffect } from "react";
import {
  pharmaciesApi,
  medicinesApi,
  categoriesApi,
  ordersApi,
  appointmentsApi,
  type Pharmacy,
  type Medicine,
  type Category,
  type Doctor,
  type Order,
} from "./api";
import {
  pharmacies as mockPharmacies,
  medicines as mockMedicines,
  categories as mockCategories,
} from "../data/mock-data";

// ---------------------------------------------------------------------------
// Generic fetcher
// ---------------------------------------------------------------------------

function useApi<T>(fetcher: () => Promise<T>, fallback: T): {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("API unavailable, using fallback data:", err.message);
          setData(fallback);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ---------------------------------------------------------------------------
// Adapters — convert snake_case API responses to camelCase frontend types
// ---------------------------------------------------------------------------

function toFrontendPharmacy(p: Pharmacy) {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    district: p.district,
    rating: p.rating,
    reviewCount: p.review_count,
    image: p.image || "",
    isOpen: p.is_open,
    openHours: p.open_hours || "",
    phone: p.phone || "",
    deliveryFee: p.delivery_fee,
    deliveryTime: p.delivery_time || "",
    distance: p.distance || "",
  };
}

function toFrontendMedicine(m: Medicine) {
  return {
    id: m.id,
    name: m.name,
    genericName: m.generic_name || "",
    category: m.category || "",
    description: m.description || "",
    requiresPrescription: m.requires_prescription,
    image: m.image || "",
    prices: m.prices.map((p) => ({
      pharmacyId: p.pharmacy_id,
      price: p.price,
      inStock: p.in_stock,
    })),
  };
}

function toFrontendCategory(c: Category) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || "Pill",
    count: c.count,
  };
}

// ---------------------------------------------------------------------------
// Exported hooks
// ---------------------------------------------------------------------------

export function usePharmacies() {
  const result = useApi(
    () => pharmaciesApi.list().then((list) => list.map(toFrontendPharmacy)),
    mockPharmacies
  );
  return result;
}

export function usePharmacy(id: string) {
  const result = useApi(
    () => pharmaciesApi.get(id).then(toFrontendPharmacy),
    mockPharmacies.find((p) => p.id === id) || mockPharmacies[0]
  );
  return result;
}

export function useMedicines() {
  const result = useApi(
    () => medicinesApi.list().then((list) => list.map(toFrontendMedicine)),
    mockMedicines
  );
  return result;
}

export function useMedicine(id: string) {
  const result = useApi(
    () => medicinesApi.get(id).then(toFrontendMedicine),
    mockMedicines.find((m) => m.id === id) || mockMedicines[0]
  );
  return result;
}

export function useMedicineSearch(params: {
  q?: string;
  category?: string;
  in_stock_only?: boolean;
  no_prescription?: boolean;
  sort_by?: string;
}) {
  const result = useApi(
    () => medicinesApi.search(params).then((list) => list.map(toFrontendMedicine)),
    mockMedicines
  );
  return result;
}

export function useCategories() {
  const result = useApi(
    () => categoriesApi.list().then((list) => list.map(toFrontendCategory)),
    mockCategories
  );
  return result;
}

export function useDoctors() {
  return useApi(
    () => appointmentsApi.doctors(),
    []
  );
}
