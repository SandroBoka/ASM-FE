import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RegisterPage } from "../features/auth/ui/RegisterPage";
import { HomePage } from "../features/home/HomePage";
import { AppLayout } from "./AppLayout";
import { GuestRoute, ProtectedRoute } from "./AuthRoutes";
import {
    EditReservationPagePlaceholder,
    NewReservationPagePlaceholder,
    ReservationsPagePlaceholder,
    ServicesPagePlaceholder,
    VehiclesPagePlaceholder,
} from "./routePlaceholders";

export const router = createBrowserRouter([
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
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { index: true, element: <HomePage /> },
                    { path: "services", element: <ServicesPagePlaceholder /> },
                    { path: "vehicles", element: <VehiclesPagePlaceholder /> },
                    { path: "reservations", element: <ReservationsPagePlaceholder /> },
                    { path: "reservations/new", element: <NewReservationPagePlaceholder /> },
                    {
                        path: "reservations/:reservationId",
                        element: <EditReservationPagePlaceholder />,
                    },
                    {
                        element: <ProtectedRoute requiredUserType="employee" />,
                        children: [
                            {
                                path: "pending-reservations",
                                element: <h1>Pending zahtjevi (placeholder)</h1>,
                            },
                            {
                                path: "pending-changes",
                                element: <h1>Promjene termina (placeholder)</h1>,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);
