import { httpClient } from "../../../api/httpClient";
import type { Customer, Employee } from "../models/personTypes";

export function getCustomerById(customerId: number): Promise<Customer> {
    return httpClient<Customer>(`/persons/customers/${customerId}`);
}

export function getEmployeeById(employeeId: number): Promise<Employee> {
    return httpClient<Employee>(`/persons/employees/${employeeId}`);
}
