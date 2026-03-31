import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type UserRole = "employee" | "client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string; // only for client role
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
  logout: () => {},
});

// Mock users
const MOCK_USERS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: "admin@hypernova.com",
    password: "password",
    user: { id: "u1", email: "admin@hypernova.com", name: "Amanda Singh", role: "employee" },
  },
  {
    email: "employee@hypernova.com",
    password: "password",
    user: { id: "u2", email: "employee@hypernova.com", name: "John Baker", role: "employee" },
  },
  {
    email: "james.morrison@email.com",
    password: "password",
    user: { id: "u3", email: "james.morrison@email.com", name: "James Morrison", role: "client", clientId: "c1" },
  },
  {
    email: "sarah.chen@email.com",
    password: "password",
    user: { id: "u4", email: "sarah.chen@email.com", name: "Sarah Chen", role: "client", clientId: "c2" },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem("crm_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found.user);
      sessionStorage.setItem("crm_user", JSON.stringify(found.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("crm_user");
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
