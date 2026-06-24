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
// Change this if your backend runs on a different port
const API_URL = "http://localhost:5000/api";

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // On app load — restore session from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("crm_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("crm_user");
        sessionStorage.removeItem("crm_token");
      }
    }
  }, []);

  // ── Login — calls real backend ───────────────────────────
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

      // Store token and user in sessionStorage
      sessionStorage.setItem("crm_token", data.token);
      sessionStorage.setItem("crm_user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    sessionStorage.removeItem("crm_token");
    sessionStorage.removeItem("crm_user");
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
