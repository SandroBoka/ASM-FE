import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    useCreateVehicle,
    useDeleteVehicle,
    useUpdateVehicle,
    useVehiclesByCustomerId,
} from "../hooks/useVehicles";
import type { Vehicle } from "../models/vehicleTypes";
import { VehicleForm, type VehicleFormValues } from "./VehicleForm";

type Mode = { type: "list" } | { type: "create" } | { type: "edit"; vehicle: Vehicle };

function getErrorMessage(error: unknown, fallback: string): string | null {
    if (!error) {
        return null;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

export function VehiclesPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [mode, setMode] = useState<Mode>({ type: "list" });

    const isCustomer = user?.TipKorisnika === "customer";
    const customerId = isCustomer ? user?.IdOsobe : null;

    const vehiclesQuery = useVehiclesByCustomerId(customerId);
    const createMutation = useCreateVehicle();
    const updateMutation = useUpdateVehicle();
    const deleteMutation = useDeleteVehicle();

    if (!user) {
        return null;
    }

    if (!isCustomer) {
        return (
            <section className="page">
                <h1>{t("app.vehicles")}</h1>
                <Alert variant="info">{t("vehicles.employeeOnly")}</Alert>
            </section>
        );
    }

    async function handleCreate(values: VehicleFormValues) {
        await createMutation.mutateAsync({
            ...values,
            IdOsobe: user!.IdOsobe,
        });
        setMode({ type: "list" });
    }

    async function handleUpdate(vehicleId: number, values: VehicleFormValues) {
        await updateMutation.mutateAsync({
            vehicleId,
            payload: values,
        });
        setMode({ type: "list" });
    }

    function handleDelete(vehicle: Vehicle) {
        const confirmed = window.confirm(
            t("vehicles.deleteConfirm", {
                make: vehicle.Marka,
                model: vehicle.Model,
                plate: vehicle.RegOznaka,
            }),
        );
        if (!confirmed) {
            return;
        }
        deleteMutation.mutate(vehicle.IdVozila);
    }

    const fetchErrorMessage = getErrorMessage(vehiclesQuery.error, t("common.unknownError"));
    const deleteErrorMessage = getErrorMessage(deleteMutation.error, t("common.unknownError"));

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("vehicles.pageTitle")}</h1>
                {mode.type === "list" ? (
                    <AppButton onClick={() => setMode({ type: "create" })}>
                        {t("vehicles.addAction")}
                    </AppButton>
                ) : null}
            </header>

            {mode.type === "create" ? (
                <section className="page__section">
                    <h2>{t("vehicles.addTitle")}</h2>
                    <VehicleForm
                        onSubmit={handleCreate}
                        onCancel={() => setMode({ type: "list" })}
                        submitLabel={t("common.save")}
                        submittingLabel={t("common.saving")}
                        errorMessage={getErrorMessage(
                            createMutation.error,
                            t("common.unknownError"),
                        )}
                    />
                </section>
            ) : null}

            {mode.type === "edit" ? (
                <section className="page__section">
                    <h2>{t("vehicles.editTitle")}</h2>
                    <VehicleForm
                        initialValues={mode.vehicle}
                        onSubmit={(values) => handleUpdate(mode.vehicle.IdVozila, values)}
                        onCancel={() => setMode({ type: "list" })}
                        submitLabel={t("common.saveChanges")}
                        submittingLabel={t("common.saving")}
                        errorMessage={getErrorMessage(
                            updateMutation.error,
                            t("common.unknownError"),
                        )}
                    />
                </section>
            ) : null}

            <section className="page__section">
                {vehiclesQuery.isLoading ? <p>{t("common.loading")}</p> : null}

                {vehiclesQuery.isError ? (
                    <Alert variant="error">
                        {t("vehicles.fetchError", {
                            detail: fetchErrorMessage ?? t("common.unknownError"),
                        })}
                    </Alert>
                ) : null}

                {deleteMutation.isError ? (
                    <Alert variant="error">
                        {t("vehicles.deleteError", {
                            detail: deleteErrorMessage ?? t("common.unknownError"),
                        })}
                    </Alert>
                ) : null}

                {vehiclesQuery.data && vehiclesQuery.data.length === 0 ? (
                    <Alert variant="info">{t("vehicles.empty")}</Alert>
                ) : null}

                {vehiclesQuery.data && vehiclesQuery.data.length > 0 ? (
                    <ul className="vehicle-list">
                        {vehiclesQuery.data.map((vehicle) => (
                            <li key={vehicle.IdVozila} className="vehicle-list__item">
                                <div>
                                    <strong>
                                        {vehicle.Marka} {vehicle.Model}
                                    </strong>{" "}
                                    ({vehicle.Godina})
                                    <div>
                                        {vehicle.RegOznaka} · {vehicle.VrstaMotora}
                                    </div>
                                </div>
                                <div>
                                    <AppButton
                                        variant="secondary"
                                        onClick={() => setMode({ type: "edit", vehicle })}
                                    >
                                        {t("common.edit")}
                                    </AppButton>
                                    <AppButton
                                        variant="destructive"
                                        onClick={() => handleDelete(vehicle)}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {t("common.delete")}
                                    </AppButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}
