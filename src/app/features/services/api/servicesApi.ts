import { httpClient } from "../../../api/httpClient";
import type {
    Service,
    ServiceCreatePayload,
    ServiceUpdatePayload,
} from "../models/serviceTypes";

export function getServices(search?: string): Promise<Service[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return httpClient<Service[]>(`/services${query}`);
}

export function getServiceById(serviceId: number): Promise<Service> {
    return httpClient<Service>(`/services/${serviceId}`);
}

export function createService(payload: ServiceCreatePayload): Promise<Service> {
    return httpClient<Service>("/services", {
        method: "POST",
        body: payload,
    });
}

export function updateService(
    serviceId: number,
    payload: ServiceUpdatePayload,
): Promise<Service> {
    return httpClient<Service>(`/services/${serviceId}`, {
        method: "PUT",
        body: payload,
    });
}

export function deleteService(serviceId: number): Promise<void> {
    return httpClient<void>(`/services/${serviceId}`, {
        method: "DELETE",
    });
}
