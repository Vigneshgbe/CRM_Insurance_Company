import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "employee" | "client";
  clientId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;           // true only during initial restore
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const API_URL = "http://localhost:5000/api";

// ── Storage helpers ───────────────────────────────────────────────────────────
function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("crm_token", token);
  localStorage.setItem("crm_user", JSON.stringify(user));
  // Clear any stale sessionStorage keys from old versions
  sessionStorage.removeItem("crm_token");
  sessionStorage.removeItem("crm_user");
}

function clearAuth() {
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
  sessionStorage.removeItem("crm_token");
  sessionStorage.removeItem("crm_user");
}

// Read from localStorage only — single source of truth
function loadStoredAuth(): { token: string; user: AuthUser } | null {
  const token = localStorage.getItem("crm_token");
  const raw   = localStorage.getItem("crm_user");
  if (!token || !raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.id || !user?.role) return null;
    return { token, user };
  } catch {
    return null;
  }
}

// ── JWT expiry check (without a library) ─────────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    // Give a 30-second buffer
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return false; // Malformed token — let the server reject it
  }
}

// ── Public token getter — used by all tab components ─────────────────────────
export function getToken(): string {
  return localStorage.getItem("crm_token") || "";
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise synchronously from localStorage so there is no flash
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = loadStoredAuth();
    if (!stored) return null;
    // If token is already expired on first render, clear and force login
    if (isTokenExpired(stored.token)) {
      clearAuth();
      return null;
    }
    return stored.user;
  });

  // loading is only true for the first render cycle —
  // because we init synchronously it will be false immediately
  const [loading, setLoading] = useState(false);

  // Periodic token expiry check — every 60 seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const token = getToken();
      if (token && isTokenExpired(token)) {
        clearAuth();
        setUser(null);
        // Redirect to login — reload is the cleanest way since we can't
        // import useNavigate here (not inside a Router component)
        window.location.href = "/login";
      }
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
  function logout() {
    clearAuth();
    setUser(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
