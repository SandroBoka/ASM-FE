import { useQuery } from "@tanstack/react-query";
import * as personsApi from "../api/personsApi";
import type { Customer, Employee } from "../models/personTypes";

const PERSONS_QUERY_KEY = "persons";

export function useCustomerById(customerId: number | null | undefined) {
    return useQuery<Customer>({
        queryKey: [PERSONS_QUERY_KEY, "customer", customerId],
        queryFn: () => personsApi.getCustomerById(customerId as number),
        enabled: typeof customerId === "number",
    });
}

export function useEmployeeById(employeeId: number | null | undefined) {
    return useQuery<Employee>({
        queryKey: [PERSONS_QUERY_KEY, "employee", employeeId],
        queryFn: () => personsApi.getEmployeeById(employeeId as number),
        enabled: typeof employeeId === "number",
    });
}
