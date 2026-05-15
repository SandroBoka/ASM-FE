import { createBrowserRouter, Navigate } from "react-router-dom";
import {
    EditReservationPagePlaceholder,
    HomePagePlaceholder,
    LoginPagePlaceholder,
    NewReservationPagePlaceholder,
    RegisterPagePlaceholder,
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
        element: <LoginPagePlaceholder />,
    },
    {
        path: "/register",
        element: <RegisterPagePlaceholder />,
    },
    {
        path: "/app",
        element: <HomePagePlaceholder />,
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
