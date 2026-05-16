import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RegisterPage } from "../features/auth/ui/RegisterPage";
import { HomePage } from "../features/home/HomePage";
import { NewReservationPage } from "../features/reservations/ui/NewReservationPage";
import { PendingReservationsPage } from "../features/reservations/ui/PendingReservationsPage";
import { ReservationDetailsPage } from "../features/reservations/ui/ReservationDetailsPage";
import { ReservationsPage } from "../features/reservations/ui/ReservationsPage";
import { ServicesPage } from "../features/services/ui/ServicesPage";
import { VehiclesPage } from "../features/vehicles/ui/VehiclesPage";
import { AppLayout } from "./AppLayout";
import { GuestRoute, ProtectedRoute } from "./AuthRoutes";

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
                    { path: "services", element: <ServicesPage /> },
                    { path: "vehicles", element: <VehiclesPage /> },
                    { path: "reservations", element: <ReservationsPage /> },
                    { path: "reservations/new", element: <NewReservationPage /> },
                    {
                        path: "reservations/:reservationId",
                        element: <ReservationDetailsPage />,
                    },
                    {
                        element: <ProtectedRoute requiredUserType="employee" />,
                        children: [
                            {
                                path: "pending-reservations",
                                element: <PendingReservationsPage />,
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
