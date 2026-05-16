import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as vehiclesApi from "../api/vehiclesApi";
import type {
    Vehicle,
    VehicleCreatePayload,
    VehicleUpdatePayload,
} from "../models/vehicleTypes";

const VEHICLES_QUERY_KEY = "vehicles";

export function useVehiclesByCustomerId(customerId: number | null | undefined) {
    return useQuery<Vehicle[]>({
        queryKey: [VEHICLES_QUERY_KEY, "customer", customerId],
        queryFn: () => vehiclesApi.getVehiclesByCustomerId(customerId as number),
        enabled: typeof customerId === "number",
    });
}

export function useVehicleById(vehicleId: number | null | undefined) {
    return useQuery<Vehicle>({
        queryKey: [VEHICLES_QUERY_KEY, "detail", vehicleId],
        queryFn: () => vehiclesApi.getVehicleById(vehicleId as number),
        enabled: typeof vehicleId === "number",
    });
}

export function useCreateVehicle() {
    const queryClient = useQueryClient();

    return useMutation<Vehicle, Error, VehicleCreatePayload>({
        mutationFn: (payload) => vehiclesApi.createVehicle(payload),
        onSuccess: (vehicle) => {
            queryClient.invalidateQueries({
                queryKey: [VEHICLES_QUERY_KEY, "customer", vehicle.IdOsobe],
            });
        },
    });
}

export function useUpdateVehicle() {
    const queryClient = useQueryClient();

    return useMutation<Vehicle, Error, { vehicleId: number; payload: VehicleUpdatePayload }>({
        mutationFn: ({ vehicleId, payload }) =>
            vehiclesApi.updateVehicle(vehicleId, payload),
        onSuccess: (vehicle) => {
            queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] });
            queryClient.setQueryData(
                [VEHICLES_QUERY_KEY, "detail", vehicle.IdVozila],
                vehicle,
            );
        },
    });
}

export function useDeleteVehicle() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: (vehicleId) => vehiclesApi.deleteVehicle(vehicleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] });
        },
    });
}
