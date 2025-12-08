import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Booking, CleanerJob, User, Property, Payment } from "@shared/schema";

const API_BASE = "/api";

// Fetch helpers
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function patchJson<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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

// ===== BOOKINGS =====
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

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cleaningStatus }: { 
      id: number; 
      status: string; 
      cleaningStatus?: string 
    }) => patchJson(`${API_BASE}/bookings/${id}`, { status, cleaningStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// ===== CLEANER JOBS =====
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

export function useCompleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: number) => patchJson(`${API_BASE}/jobs/${jobId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ===== PAYMENTS =====
export function usePayments(userId: number) {
  return useQuery<Payment[]>({
    queryKey: ["payments", userId],
    queryFn: () => fetchJson(`${API_BASE}/payments/user/${userId}`),
    enabled: !!userId,
  });
}

// ===== SYNC LOGS =====
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

// ===== STATS =====
export function useHostStats(hostId: number) {
  return useQuery({
    queryKey: ["stats", "host", hostId],
    queryFn: () => fetchJson<{
      totalRevenue: number;
      activeBookings: number;
      completedCleanings: number;
      totalProperties: number;
    }>(`${API_BASE}/stats/host/${hostId}`),
    enabled: !!hostId,
  });
}

export function useCleanerStats(cleanerId: number) {
  return useQuery({
    queryKey: ["stats", "cleaner", cleanerId],
    queryFn: () => fetchJson<{
      totalEarnings: number;
      pendingJobs: number;
      completedJobs: number;
      totalJobs: number;
    }>(`${API_BASE}/stats/cleaner/${cleanerId}`),
    enabled: !!cleanerId,
  });
}
