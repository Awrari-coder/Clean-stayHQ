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
    queryFn: () => fetchJson<{
      totalPending: number;
      totalCompleted: number;
      totalAllTime: number;
      payouts: any[];
    }>(`${API_BASE}/cleaner/payouts`),
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

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchJson<{
      cleanerPerformance: any[];
      revenueAnalytics: {
        totalBookingRevenue: string;
        totalCleaningCosts: string;
        grossProfit: string;
        profitMargin: string;
        avgRevenuePerBooking: string;
        avgCleaningCost: string;
      };
      jobProfitAnalysis: any[];
      monthlyRevenue: { month: string; revenue: string }[];
      pendingPayouts: number;
      totalPayoutsPending: string;
    }>(`${API_BASE}/admin/analytics`),
  });
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/payouts`),
  });
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: number) => postJson(`${API_BASE}/admin/payouts/${payoutId}/mark-paid`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] });
    },
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

// ===== HOST CALENDAR & SYNC =====
export function useHostSyncLogs() {
  return useQuery({
    queryKey: ["host", "sync-logs"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/host/sync-logs`),
  });
}

export function usePropertySync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: number) => postJson(`${API_BASE}/host/properties/${propertyId}/sync`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["host", "sync-logs"] });
    },
  });
}

// ===== CLEANER AVAILABILITY =====
export function useCleanerAvailability() {
  return useQuery({
    queryKey: ["cleaner", "availability"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/cleaner/availability`),
  });
}

async function putJson<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { availability: Array<{ weekday: number; startTime: string; endTime: string }> }) => 
      putJson(`${API_BASE}/cleaner/availability`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner", "availability"] });
    },
  });
}

export function useCleanerTimeOff() {
  return useQuery({
    queryKey: ["cleaner", "timeoff"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/cleaner/timeoff`),
  });
}

export function useAddTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { startDate: string; endDate: string; reason?: string }) => 
      postJson(`${API_BASE}/cleaner/timeoff`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner", "timeoff"] });
    },
  });
}

async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJson(`${API_BASE}/cleaner/timeoff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner", "timeoff"] });
    },
  });
}

// ===== HOST PROPERTY MANAGEMENT =====
export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; address: string; city?: string; state?: string; zip?: string; icalUrl?: string }) => 
      postJson<Property>(`${API_BASE}/host/properties`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["host", "stats"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; address: string; city: string; state: string; zip: string; icalUrl: string }> }) => 
      putJson<Property>(`${API_BASE}/host/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host", "properties"] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJson(`${API_BASE}/host/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["host", "stats"] });
    },
  });
}

// ===== ADMIN DEMAND & DISPATCH =====
export function useAdminDemand(from?: string, to?: string, status?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (status) params.set("status", status);
  const queryString = params.toString();
  
  return useQuery({
    queryKey: ["admin", "demand", from, to, status],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/demand${queryString ? `?${queryString}` : ""}`),
  });
}

export function useAdminCleaners() {
  return useQuery({
    queryKey: ["admin", "cleaners"],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/cleaners`),
  });
}

export function useJobCandidates(bookingId: number | null) {
  return useQuery({
    queryKey: ["admin", "candidates", bookingId],
    queryFn: () => fetchJson<any[]>(`${API_BASE}/admin/jobs/${bookingId}/candidates`),
    enabled: !!bookingId,
  });
}

export function useAssignJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, cleanerId }: { bookingId: number; cleanerId: number }) => 
      postJson(`${API_BASE}/admin/jobs/${bookingId}/assign`, { cleanerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "demand"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
  });
}
