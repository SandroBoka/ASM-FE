import { httpClient } from "../../../api/httpClient";
import type { Vehicle, VehicleCreatePayload, VehicleUpdatePayload } from "../models/vehicleTypes";

export function getVehiclesByCustomerId(customerId: number): Promise<Vehicle[]> {
    return httpClient<Vehicle[]>(`/vehicles/customers/${customerId}`);
}

export function getVehicleById(vehicleId: number): Promise<Vehicle> {
    return httpClient<Vehicle>(`/vehicles/${vehicleId}`);
}

export function createVehicle(payload: VehicleCreatePayload): Promise<Vehicle> {
    return httpClient<Vehicle>("/vehicles", {
        method: "POST",
        body: payload,
    });
}

export function updateVehicle(vehicleId: number, payload: VehicleUpdatePayload): Promise<Vehicle> {
    return httpClient<Vehicle>(`/vehicles/${vehicleId}`, {
        method: "PUT",
        body: payload,
    });
}

export function deleteVehicle(vehicleId: number): Promise<void> {
    return httpClient<void>(`/vehicles/${vehicleId}`, {
        method: "DELETE",
    });
}
