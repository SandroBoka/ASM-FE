import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserType } from "../features/auth/models/authTypes";
import { useAuth } from "../features/auth/hooks/useAuth";

type ProtectedRouteProps = {
    children?: ReactNode;
    requiredUserType?: UserType;
};

type GuestRouteProps = {
    children: ReactNode;
};

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (requiredUserType && user.TipKorisnika !== requiredUserType) {
        return <Navigate to="/" replace />;
    }

    return <>{children ?? <Outlet />}</>;
}

export function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}
