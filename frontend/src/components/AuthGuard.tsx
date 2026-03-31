import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect clients to their portal, employees to dashboard
    const fallback = user.role === "client" ? "/portal" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
