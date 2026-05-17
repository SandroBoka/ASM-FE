import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/appointmentChangesApi";
import type {
    AppointmentChange,
    AppointmentChangeActionPayload,
    AppointmentChangeCreatePayload,
} from "../models/appointmentChangeTypes";

const CHANGES_QUERY_KEY = "appointment-changes";
const APPOINTMENTS_QUERY_KEY = "appointments";
const RESERVATIONS_QUERY_KEY = "reservations";

export function usePendingChanges(enabled = true) {
    return useQuery<AppointmentChange[]>({
        queryKey: [CHANGES_QUERY_KEY, "pending"],
        queryFn: () => api.getPendingChanges(),
        enabled,
    });
}

export function useChangesForReservation(reservationId: number | null | undefined) {
    return useQuery<AppointmentChange[]>({
        queryKey: [CHANGES_QUERY_KEY, "reservation", reservationId],
        queryFn: () => api.getChangesForReservation(reservationId as number),
        enabled: typeof reservationId === "number",
    });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: [CHANGES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] });
}

export function useCreateAppointmentChange() {
    const queryClient = useQueryClient();
    return useMutation<AppointmentChange, Error, AppointmentChangeCreatePayload>({
        mutationFn: (payload) => api.createAppointmentChange(payload),
        onSuccess: () => {
            invalidateAll(queryClient);
        },
    });
}

type ActionVariables = {
    changeId: number;
    payload: AppointmentChangeActionPayload;
};

export function useAcceptChange() {
    const queryClient = useQueryClient();
    return useMutation<AppointmentChange, Error, ActionVariables>({
        mutationFn: ({ changeId, payload }) => api.acceptChange(changeId, payload),
        onSuccess: () => {
            invalidateAll(queryClient);
        },
    });
}

export function useRejectChange() {
    const queryClient = useQueryClient();
    return useMutation<AppointmentChange, Error, ActionVariables>({
        mutationFn: ({ changeId, payload }) => api.rejectChange(changeId, payload),
        onSuccess: () => {
            invalidateAll(queryClient);
        },
    });
}
