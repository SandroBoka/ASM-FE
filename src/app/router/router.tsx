import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RegisterPage } from "../features/auth/ui/RegisterPage";
import { HomePage } from "../features/home/HomePage";
import {
    EditReservationPagePlaceholder,
    NewReservationPagePlaceholder,
    ReservationsPagePlaceholder,
    ServicesPagePlaceholder,
    VehiclesPagePlaceholder,
} from "./routePlaceholders";
import { GuestRoute, ProtectedRoute } from "./AuthRoutes";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/login",
        element: (
            <GuestRoute>
                <LoginPage />
            </GuestRoute>
        ),
    },
    {
        path: "/register",
        element: (
            <GuestRoute>
                <RegisterPage />
            </GuestRoute>
        ),
    },
    {
        path: "/services",
        element: (
            <ProtectedRoute>
                <ServicesPagePlaceholder />
            </ProtectedRoute>
        ),
    },
    {
        path: "/vehicles",
        element: (
            <ProtectedRoute>
                <VehiclesPagePlaceholder />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reservations",
        element: (
            <ProtectedRoute>
                <ReservationsPagePlaceholder />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reservations/new",
        element: (
            <ProtectedRoute>
                <NewReservationPagePlaceholder />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reservations/:reservationId",
        element: (
            <ProtectedRoute>
                <EditReservationPagePlaceholder />
            </ProtectedRoute>
        ),
    },
]);
