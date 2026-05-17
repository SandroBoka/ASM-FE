import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as reservationsApi from "../api/reservationsApi";
import type {
    Reservation,
    ReservationActionPayload,
    ReservationCreatePayload,
} from "../models/reservationTypes";

const RESERVATIONS_QUERY_KEY = "reservations";
const APPOINTMENTS_QUERY_KEY = "appointments";

export function useReservationsByCustomer(customerId: number | null | undefined) {
    return useQuery<Reservation[]>({
        queryKey: [RESERVATIONS_QUERY_KEY, "customer", customerId],
        queryFn: () => reservationsApi.getReservationsByCustomer(customerId as number),
        enabled: typeof customerId === "number",
    });
}

export function usePendingReservations(enabled = true) {
    return useQuery<Reservation[]>({
        queryKey: [RESERVATIONS_QUERY_KEY, "pending"],
        queryFn: () => reservationsApi.getPendingReservations(),
        enabled,
    });
}

export function useAllReservations(enabled = true) {
    return useQuery<Reservation[]>({
        queryKey: [RESERVATIONS_QUERY_KEY, "all"],
        queryFn: () => reservationsApi.getAllReservations(),
        enabled,
    });
}

export function useReservationById(reservationId: number | null | undefined) {
    return useQuery<Reservation>({
        queryKey: [RESERVATIONS_QUERY_KEY, "detail", reservationId],
        queryFn: () => reservationsApi.getReservationById(reservationId as number),
        enabled: typeof reservationId === "number",
    });
}

function invalidateReservationsAndAppointments(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
}

export function useCreateReservation() {
    const queryClient = useQueryClient();

    return useMutation<Reservation, Error, ReservationCreatePayload>({
        mutationFn: (payload) => reservationsApi.createReservation(payload),
        onSuccess: () => {
            invalidateReservationsAndAppointments(queryClient);
        },
    });
}

type ActionVariables = {
    reservationId: number;
    payload: ReservationActionPayload;
};

export function useApproveReservation() {
    const queryClient = useQueryClient();

    return useMutation<Reservation, Error, ActionVariables>({
        mutationFn: ({ reservationId, payload }) =>
            reservationsApi.approveReservation(reservationId, payload),
        onSuccess: () => {
            invalidateReservationsAndAppointments(queryClient);
        },
    });
}

export function useRejectReservation() {
    const queryClient = useQueryClient();

    return useMutation<Reservation, Error, ActionVariables>({
        mutationFn: ({ reservationId, payload }) =>
            reservationsApi.rejectReservation(reservationId, payload),
        onSuccess: () => {
            invalidateReservationsAndAppointments(queryClient);
        },
    });
}

export function useCancelReservation() {
    const queryClient = useQueryClient();

    return useMutation<Reservation, Error, ActionVariables>({
        mutationFn: ({ reservationId, payload }) =>
            reservationsApi.cancelReservation(reservationId, payload),
        onSuccess: () => {
            invalidateReservationsAndAppointments(queryClient);
        },
    });
}

export function useCompleteReservation() {
    const queryClient = useQueryClient();

    return useMutation<Reservation, Error, number>({
        mutationFn: (reservationId) => reservationsApi.completeReservation(reservationId),
        onSuccess: () => {
            invalidateReservationsAndAppointments(queryClient);
        },
    });
}
