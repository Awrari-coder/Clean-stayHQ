import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import type { Booking, CleanerJob, User, Property, Payment } from "@shared/schema";

const API_BASE = "/api";

// Fetch helpers with auth
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function patchJson<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ===== USERS =====
export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => fetchJson(`${API_BASE}/users`),
  });
}

export function useUser(id: number) {
  return useQuery<User>({
    queryKey: ["users", id],
    queryFn: () => fetchJson(`${API_BASE}/users/${id}`),
    enabled: !!id,
  });
}

// ===== HOST ROUTES =====
export function useHostBookings() {
  return useQuery({
    queryKey: ["host", "bookings"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/host/bookings`),
  });
}

export function useHostProperties() {
  return useQuery({
    queryKey: ["host", "properties"],
    queryFn: () => fetchJson<Property[]>(`${API_BASE}/host/properties`),
  });
}

export function useHostStats() {
  return useQuery({
    queryKey: ["host", "stats"],
    queryFn: () => fetchJson<{
      totalRevenue: number;
      activeBookings: number;
      completedCleanings: number;
      totalProperties: number;
    }>(`${API_BASE}/host/stats`),
  });
}

export function useHostSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJson(`${API_BASE}/host/sync`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host"] });
    },
  });
}

// ===== CLEANER ROUTES =====
export function useCleanerJobs() {
  return useQuery({
    queryKey: ["cleaner", "jobs"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/cleaner/jobs`),
  });
}

export function useCleanerStats() {
  return useQuery({
    queryKey: ["cleaner", "stats"],
    queryFn: () => fetchJson<{
      totalEarnings: number;
      pendingJobs: number;
      completedJobs: number;
      totalJobs: number;
    }>(`${API_BASE}/cleaner/stats`),
  });
}

export function useCleanerPayouts() {
  return useQuery({
    queryKey: ["cleaner", "payouts"],
    queryFn: () => fetchJson<Payment[]>(`${API_BASE}/cleaner/payouts`),
  });
}

export function useAcceptJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: number) => postJson(`${API_BASE}/cleaner/jobs/${jobId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner"] });
    },
  });
}

export function useCompleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: number) => postJson(`${API_BASE}/cleaner/jobs/${jobId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner"] });
    },
  });
}

// ===== ADMIN ROUTES =====
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchJson<User[]>(`${API_BASE}/admin/users`),
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/bookings`),
  });
}

export function useAdminJobs() {
  return useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/jobs`),
  });
}

export function useAdminIntegrations() {
  return useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: () => fetchJson<any>(`${API_BASE}/admin/integrations`),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchJson<any>(`${API_BASE}/admin/stats`),
  });
}

// ===== LEGACY ROUTES (for backward compatibility) =====
export function useBookings(propertyId?: number) {
  return useQuery<Booking[]>({
    queryKey: ["bookings", propertyId],
    queryFn: () => {
      const url = propertyId 
        ? `${API_BASE}/bookings?propertyId=${propertyId}`
        : `${API_BASE}/bookings`;
      return fetchJson(url);
    },
  });
}

export function useJobs(cleanerId?: number) {
  return useQuery<CleanerJob[]>({
    queryKey: ["jobs", cleanerId],
    queryFn: () => {
      const url = cleanerId 
        ? `${API_BASE}/jobs?cleanerId=${cleanerId}`
        : `${API_BASE}/jobs`;
      return fetchJson(url);
    },
  });
}

export function useCreateSyncLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { source: string; status: string; message?: string }) => 
      postJson(`${API_BASE}/sync`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
    },
  });
}
