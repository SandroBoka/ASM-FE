import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as servicesApi from "../api/servicesApi";
import type {
    Service,
    ServiceCreatePayload,
    ServiceUpdatePayload,
} from "../models/serviceTypes";

const SERVICES_QUERY_KEY = "services";

export function useServices(search?: string) {
    return useQuery<Service[]>({
        queryKey: [SERVICES_QUERY_KEY, "list", search ?? null],
        queryFn: () => servicesApi.getServices(search),
    });
}

export function useServiceById(serviceId: number | null | undefined) {
    return useQuery<Service>({
        queryKey: [SERVICES_QUERY_KEY, "detail", serviceId],
        queryFn: () => servicesApi.getServiceById(serviceId as number),
        enabled: typeof serviceId === "number",
    });
}

export function useCreateService() {
    const queryClient = useQueryClient();

    return useMutation<Service, Error, ServiceCreatePayload>({
        mutationFn: (payload) => servicesApi.createService(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SERVICES_QUERY_KEY] });
        },
    });
}

export function useUpdateService() {
    const queryClient = useQueryClient();

    return useMutation<Service, Error, { serviceId: number; payload: ServiceUpdatePayload }>({
        mutationFn: ({ serviceId, payload }) =>
            servicesApi.updateService(serviceId, payload),
        onSuccess: (service) => {
            queryClient.invalidateQueries({ queryKey: [SERVICES_QUERY_KEY] });
            queryClient.setQueryData(
                [SERVICES_QUERY_KEY, "detail", service.IdUsluge],
                service,
            );
        },
    });
}

export function useDeleteService() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: (serviceId) => servicesApi.deleteService(serviceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SERVICES_QUERY_KEY] });
        },
    });
}
