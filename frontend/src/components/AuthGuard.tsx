import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("employee" | "client")[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();

  // While restoring auth from localStorage — render nothing to avoid flash redirect
  // With synchronous useState init in auth.tsx this will almost never be true,
  // but the check prevents any edge-case redirect on slow devices
  if (loading) {
    return null;
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role — redirect to appropriate home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "client" ? "/portal" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
