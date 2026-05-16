import { httpClient } from "../../../api/httpClient";
import type { Appointment, AppointmentFreeFilter } from "../models/appointmentTypes";

export function getFreeAppointments(filter: AppointmentFreeFilter = {}): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filter.dateFrom) {
        params.set("date_from", filter.dateFrom);
    }
    if (filter.dateTo) {
        params.set("date_to", filter.dateTo);
    }
    const query = params.toString();
    return httpClient<Appointment[]>(
        `/appointments/free${query ? `?${query}` : ""}`,
    );
}

export function getAllAppointments(): Promise<Appointment[]> {
    return httpClient<Appointment[]>("/appointments");
}

export function getAppointmentById(appointmentId: number): Promise<Appointment> {
    return httpClient<Appointment>(`/appointments/${appointmentId}`);
}
