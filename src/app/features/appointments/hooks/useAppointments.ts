import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as appointmentsApi from "../api/appointmentsApi";
import type {
    Appointment,
    AppointmentCreatePayload,
    AppointmentFreeFilter,
    AppointmentUpdatePayload,
} from "../models/appointmentTypes";

const APPOINTMENTS_QUERY_KEY = "appointments";

export function useFreeAppointments(filter: AppointmentFreeFilter, enabled = true) {
    return useQuery<Appointment[]>({
        queryKey: [APPOINTMENTS_QUERY_KEY, "free", filter.dateFrom ?? null, filter.dateTo ?? null],
        queryFn: () => appointmentsApi.getFreeAppointments(filter),
        enabled,
    });
}

export function useAllAppointments(enabled = true) {
    return useQuery<Appointment[]>({
        queryKey: [APPOINTMENTS_QUERY_KEY, "all"],
        queryFn: () => appointmentsApi.getAllAppointments(),
        enabled,
    });
}

export function useAppointmentById(appointmentId: number | null | undefined) {
    return useQuery<Appointment>({
        queryKey: [APPOINTMENTS_QUERY_KEY, "detail", appointmentId],
        queryFn: () => appointmentsApi.getAppointmentById(appointmentId as number),
        enabled: typeof appointmentId === "number",
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();
    return useMutation<Appointment, Error, AppointmentCreatePayload>({
        mutationFn: (payload) => appointmentsApi.createAppointment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
        },
    });
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient();
    return useMutation<
        Appointment,
        Error,
        { appointmentId: number; payload: AppointmentUpdatePayload }
    >({
        mutationFn: ({ appointmentId, payload }) =>
            appointmentsApi.updateAppointment(appointmentId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
        },
    });
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, number>({
        mutationFn: (appointmentId) => appointmentsApi.deleteAppointment(appointmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
        },
    });
}
