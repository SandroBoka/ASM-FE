import { createBrowserRouter, Navigate } from "react-router-dom";
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

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/app" replace />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "/app",
        element: <HomePage />,
    },
    {
        path: "/app/services",
        element: <ServicesPagePlaceholder />,
    },
    {
        path: "/app/vehicles",
        element: <VehiclesPagePlaceholder />,
    },
    {
        path: "/app/reservations",
        element: <ReservationsPagePlaceholder />,
    },
    {
        path: "/app/reservations/new",
        element: <NewReservationPagePlaceholder />,
    },
    {
        path: "/app/reservations/:reservationId",
        element: <EditReservationPagePlaceholder />,
    },
]);
