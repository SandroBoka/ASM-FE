import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

type RouteGuardProps = {
    children: ReactNode;
};

export function ProtectedRoute({ children }: RouteGuardProps) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export function GuestRoute({ children }: RouteGuardProps) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}
