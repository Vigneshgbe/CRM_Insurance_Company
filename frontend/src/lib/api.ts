// ============================================================
// api.ts — Central API layer for Padak Pvt Ltd CRM
// All calls go to http://localhost:5000/api
// Replaces ALL mockData.ts usage
// ============================================================

const BASE_URL = "http://localhost:5000/api";

// ── Auth token helper ────────────────────────────────────────
function getToken(): string {
  return localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token") || "";
}

// ── Core fetch wrapper ───────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── File upload (no Content-Type header — browser sets boundary) ──
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================
// AUTH
// ============================================================
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<{ user: any }>("/auth/me"),
};

// ============================================================
// DASHBOARD
// ============================================================
export const dashboardApi = {
  getStats: () =>
    apiFetch<{
      totalCases: number;
      activeCases: number;
      casesThisMonth: number;
      settlementsPending: number;
    }>("/dashboard/stats"),

  getRecentCases: () => apiFetch<any[]>("/dashboard/recent-cases"),

  getUpcomingLimitations: () =>
    apiFetch<any[]>("/dashboard/upcoming-limitations"),

  getRecentActivities: () =>
    apiFetch<any[]>("/dashboard/recent-activities"),
};

// ============================================================
// REFERRERS
// ============================================================
export const referrersApi = {
  getAll: () => apiFetch<any[]>("/referrers"),
};

// ============================================================
// CLIENTS
// ============================================================
export const clientsApi = {
  getAll: (params?: { search?: string }) => {
    const q = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return apiFetch<any[]>(`/clients${q}`);
  },

  getById: (id: string) => apiFetch<any>(`/clients/${id}`),

  create: (data: any) =>
    apiFetch<any>("/clients", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<any>(`/clients/${id}`, { method: "DELETE" }),
};

// ============================================================
// CASES
// ============================================================
export const casesApi = {
  getAll: (params?: {
    search?: string;
    status?: string;
    caseType?: string;
    assignedTo?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.caseType) q.set("caseType", params.caseType);
    if (params?.assignedTo) q.set("assignedTo", params.assignedTo);
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    const qs = q.toString();
    return apiFetch<any[]>(`/cases${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => apiFetch<any>(`/cases/${id}`),

  getByFileNo: (fileNo: string) =>
    apiFetch<any>(`/cases/by-file/${encodeURIComponent(fileNo)}`),

  create: (data: any) =>
    apiFetch<any>("/cases", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/cases/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<any>(`/cases/${id}`, { method: "DELETE" }),
};

// ============================================================
// NOTES
// ============================================================
export const notesApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/notes`),

  create: (caseId: string, data: { date?: string; time?: string; author?: string; text: string }) =>
    apiFetch<any>(`/cases/${caseId}/notes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (caseId: string, noteId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (caseId: string, noteId: string) =>
    apiFetch<any>(`/cases/${caseId}/notes/${noteId}`, { method: "DELETE" }),
};

// ============================================================
// ACTIVITIES
// ============================================================
export const activitiesApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/activities`),

  create: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (caseId: string, activityId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/activities/${activityId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (caseId: string, activityId: string) =>
    apiFetch<any>(`/cases/${caseId}/activities/${activityId}`, {
      method: "DELETE",
    }),
};

// ============================================================
// HISTORY
// ============================================================
export const historyApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/history`),

  getStatusHistory: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/status-history`),
};

// ============================================================
// SETTLEMENT
// ============================================================
export const settlementApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/settlement`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/settlement`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// CONTACT ACCESS
// ============================================================
export const contactAccessApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/contact-access`),

  create: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/contact-access`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (caseId: string, contactId: string) =>
    apiFetch<any>(`/cases/${caseId}/contact-access/${contactId}`, {
      method: "DELETE",
    }),
};

// ============================================================
// THIRD PARTY
// ============================================================
export const thirdPartyApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/third-party`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/third-party`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// NO FAULT
// ============================================================
export const noFaultApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/no-fault`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/no-fault`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// MEDICAL
// ============================================================
export const medicalApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/medical`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/medical`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// EMPLOYMENT
// ============================================================
export const employmentApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/employment`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/employment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// POLICE INFO
// ============================================================
export const policeInfoApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/police-info`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/police-info`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// LAWYERS
// ============================================================
export const lawyersApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/lawyers`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/lawyers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// SPECIALIST
// ============================================================
export const specialistApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/specialist`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/specialist`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// INITIAL INTERVIEW
// ============================================================
export const initialInterviewApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/initial-interview`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/initial-interview`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// CLIENT INFO
// ============================================================
export const clientInfoApi = {
  getByCaseId: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/client-info`),

  upsert: (caseId: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/client-info`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// DOCUMENTS
// ============================================================
export const documentsApi = {
  getAll: (params?: { search?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    const qs = q.toString();
    return apiFetch<any[]>(`/documents${qs ? `?${qs}` : ""}`);
  },

  getByCaseId: (caseId: string) =>
    apiFetch<any[]>(`/cases/${caseId}/documents`),

  upload: (caseId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (category) formData.append("category", category);
    return apiUpload<any>(`/cases/${caseId}/documents`, formData);
  },

  rename: (id: string, name: string) =>
    apiFetch<any>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    apiFetch<any>(`/documents/${id}`, { method: "DELETE" }),
};

// ============================================================
// OCF FORMS
// ============================================================
export const ocfApi = {
  getPrefill: (caseId: string) =>
    apiFetch<any>(`/cases/${caseId}/ocf/prefill`),

  getFormData: (caseId: string, formNumber: string) =>
    apiFetch<any>(`/cases/${caseId}/ocf/${formNumber}`),

  saveFormData: (caseId: string, formNumber: string, data: any) =>
    apiFetch<any>(`/cases/${caseId}/ocf/${formNumber}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================================
// USERS (Settings)
// ============================================================
export const usersApi = {
  getAll: () => apiFetch<any[]>("/users"),

  create: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    displayRole?: string;
  }) =>
    apiFetch<any>("/users", { method: "POST", body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<any>(`/users/${id}`, { method: "DELETE" }),
};

// ============================================================
// REPORTS
// ============================================================
export const reportsApi = {
  getStatusSummary: () => apiFetch<any[]>("/reports/status-summary"),
  getMonthly: () => apiFetch<any[]>("/reports/monthly"),
  getLimitations: () => apiFetch<any[]>("/reports/limitations"),
  getSettlements: () => apiFetch<any[]>("/reports/settlements"),
};

// ============================================================
// CLIENT PORTAL
// ============================================================
export const portalApi = {
  getCases: () => apiFetch<any[]>("/portal/cases"),
  getDocuments: () => apiFetch<any[]>("/portal/documents"),
  getStatusHistory: (caseId: string) =>
    apiFetch<any[]>(`/portal/status-history/${caseId}`),
};
