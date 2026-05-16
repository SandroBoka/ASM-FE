import { useQuery } from "@tanstack/react-query";
import * as appointmentsApi from "../api/appointmentsApi";
import type { Appointment, AppointmentFreeFilter } from "../models/appointmentTypes";

const APPOINTMENTS_QUERY_KEY = "appointments";

export function useFreeAppointments(filter: AppointmentFreeFilter, enabled = true) {
    return useQuery<Appointment[]>({
        queryKey: [APPOINTMENTS_QUERY_KEY, "free", filter.dateFrom ?? null, filter.dateTo ?? null],
        queryFn: () => appointmentsApi.getFreeAppointments(filter),
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
