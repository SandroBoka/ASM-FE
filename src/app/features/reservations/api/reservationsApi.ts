import { httpClient } from "../../../api/httpClient";
import type {
    Reservation,
    ReservationActionPayload,
    ReservationCreatePayload,
} from "../models/reservationTypes";

export function createReservation(
    payload: ReservationCreatePayload,
): Promise<Reservation> {
    return httpClient<Reservation>("/reservations", {
        method: "POST",
        body: payload,
    });
}

export function getPendingReservations(): Promise<Reservation[]> {
    return httpClient<Reservation[]>("/reservations/pending");
}

export function getReservationsByCustomer(customerId: number): Promise<Reservation[]> {
    return httpClient<Reservation[]>(`/reservations/customer/${customerId}`);
}

export function getAllReservations(): Promise<Reservation[]> {
    return httpClient<Reservation[]>("/reservations");
}

export function getReservationById(reservationId: number): Promise<Reservation> {
    return httpClient<Reservation>(`/reservations/${reservationId}`);
}

export function approveReservation(
    reservationId: number,
    payload: ReservationActionPayload,
): Promise<Reservation> {
    return httpClient<Reservation>(`/reservations/${reservationId}/approve`, {
        method: "POST",
        body: payload,
    });
}

export function rejectReservation(
    reservationId: number,
    payload: ReservationActionPayload,
): Promise<Reservation> {
    return httpClient<Reservation>(`/reservations/${reservationId}/reject`, {
        method: "POST",
        body: payload,
    });
}

export function cancelReservation(
    reservationId: number,
    payload: ReservationActionPayload,
): Promise<Reservation> {
    return httpClient<Reservation>(`/reservations/${reservationId}/cancel`, {
        method: "POST",
        body: payload,
    });
}

export function completeReservation(reservationId: number): Promise<Reservation> {
    return httpClient<Reservation>(`/reservations/${reservationId}/complete`, {
        method: "POST",
    });
}
