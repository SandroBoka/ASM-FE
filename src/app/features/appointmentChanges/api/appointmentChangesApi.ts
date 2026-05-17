import { httpClient } from "../../../api/httpClient";
import type {
    AppointmentChange,
    AppointmentChangeActionPayload,
    AppointmentChangeCreatePayload,
} from "../models/appointmentChangeTypes";

export function createAppointmentChange(
    payload: AppointmentChangeCreatePayload,
): Promise<AppointmentChange> {
    return httpClient<AppointmentChange>("/appointment-changes", {
        method: "POST",
        body: payload,
    });
}

export function getPendingChanges(): Promise<AppointmentChange[]> {
    return httpClient<AppointmentChange[]>("/appointment-changes/pending");
}

export function getChangesForReservation(
    reservationId: number,
): Promise<AppointmentChange[]> {
    return httpClient<AppointmentChange[]>(
        `/appointment-changes/reservation/${reservationId}`,
    );
}

export function getAllChanges(): Promise<AppointmentChange[]> {
    return httpClient<AppointmentChange[]>("/appointment-changes");
}

export function acceptChange(
    changeId: number,
    payload: AppointmentChangeActionPayload,
): Promise<AppointmentChange> {
    return httpClient<AppointmentChange>(`/appointment-changes/${changeId}/accept`, {
        method: "POST",
        body: payload,
    });
}

export function rejectChange(
    changeId: number,
    payload: AppointmentChangeActionPayload,
): Promise<AppointmentChange> {
    return httpClient<AppointmentChange>(`/appointment-changes/${changeId}/reject`, {
        method: "POST",
        body: payload,
    });
}
