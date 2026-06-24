import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "employee" | "client";
  clientId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ── Backend URL ──────────────────────────────────────────────
const API_URL = "http://localhost:5000/api";

// ── Storage helpers — use localStorage so session survives refresh ──
function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("crm_token", token);
  localStorage.setItem("crm_user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
  // Also clear legacy sessionStorage keys in case old data is there
  sessionStorage.removeItem("crm_token");
  sessionStorage.removeItem("crm_user");
}

function loadStoredUser(): AuthUser | null {
  // Try localStorage first (new), fall back to sessionStorage (old)
  const stored = localStorage.getItem("crm_user") || sessionStorage.getItem("crm_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getToken(): string {
  return localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token") || "";
}

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // On app load — restore user from localStorage
  useEffect(() => {
    const storedUser = loadStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // ── Login ────────────────────────────────────────────────
  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (!data.token || !data.user) return false;

      saveAuth(data.token, data.user);
      setUser(data.user);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    clearAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}