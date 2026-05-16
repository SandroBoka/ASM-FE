import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    useCreateService,
    useDeleteService,
    useServices,
    useUpdateService,
} from "../hooks/useServices";
import type { Service } from "../models/serviceTypes";
import { ServiceForm, type ServiceFormValues } from "./ServiceForm";

type Mode =
    | { type: "list" }
    | { type: "create" }
    | { type: "edit"; service: Service };

function getErrorMessage(error: unknown, fallback: string): string | null {
    if (!error) {
        return null;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

function formatPrice(value: string): string {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        return value;
    }
    return parsed.toFixed(2);
}

export function ServicesPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [mode, setMode] = useState<Mode>({ type: "list" });

    const servicesQuery = useServices();
    const createMutation = useCreateService();
    const updateMutation = useUpdateService();
    const deleteMutation = useDeleteService();

    if (!user) {
        return null;
    }

    const isEmployee = user.TipKorisnika === "employee";

    async function handleCreate(values: ServiceFormValues) {
        await createMutation.mutateAsync(values);
        setMode({ type: "list" });
    }

    async function handleUpdate(serviceId: number, values: ServiceFormValues) {
        await updateMutation.mutateAsync({ serviceId, payload: values });
        setMode({ type: "list" });
    }

    function handleDelete(service: Service) {
        const confirmed = window.confirm(
            t("services.deleteConfirm", { name: service.NazivUsluge }),
        );
        if (!confirmed) {
            return;
        }
        deleteMutation.mutate(service.IdUsluge);
    }

    const fetchErrorMessage = getErrorMessage(
        servicesQuery.error,
        t("common.unknownError"),
    );
    const deleteErrorMessage = getErrorMessage(
        deleteMutation.error,
        t("common.unknownError"),
    );

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("services.pageTitle")}</h1>
                {isEmployee && mode.type === "list" ? (
                    <AppButton onClick={() => setMode({ type: "create" })}>
                        {t("services.addAction")}
                    </AppButton>
                ) : null}
            </header>

            {isEmployee && mode.type === "create" ? (
                <section className="page__section">
                    <h2>{t("services.addTitle")}</h2>
                    <ServiceForm
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

            {isEmployee && mode.type === "edit" ? (
                <section className="page__section">
                    <h2>{t("services.editTitle")}</h2>
                    <ServiceForm
                        initialValues={mode.service}
                        onSubmit={(values) => handleUpdate(mode.service.IdUsluge, values)}
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
                {servicesQuery.isLoading ? <p>{t("common.loading")}</p> : null}

                {servicesQuery.isError ? (
                    <Alert variant="error">
                        {t("services.fetchError", {
                            detail: fetchErrorMessage ?? t("common.unknownError"),
                        })}
                    </Alert>
                ) : null}

                {deleteMutation.isError ? (
                    <Alert variant="error">
                        {t("services.deleteError", {
                            detail: deleteErrorMessage ?? t("common.unknownError"),
                        })}
                    </Alert>
                ) : null}

                {servicesQuery.data && servicesQuery.data.length === 0 ? (
                    <Alert variant="info">{t("services.empty")}</Alert>
                ) : null}

                {servicesQuery.data && servicesQuery.data.length > 0 ? (
                    <ul className="service-list">
                        {servicesQuery.data.map((service) => (
                            <li key={service.IdUsluge} className="service-list__item">
                                <div className="service-list__row">
                                    <strong className="service-list__name">
                                        {service.NazivUsluge}
                                    </strong>
                                    <span className="service-list__price">
                                        {t("services.priceFormatted", {
                                            price: formatPrice(service.Cijena),
                                        })}
                                    </span>
                                </div>

                                {service.Opis ? (
                                    <p className="service-list__description">
                                        {service.Opis}
                                    </p>
                                ) : null}

                                <span className="service-list__duration">
                                    {t("services.durationMinutes", {
                                        minutes: service.Trajanje,
                                    })}
                                </span>

                                {isEmployee ? (
                                    <div className="service-list__actions">
                                        <AppButton
                                            variant="secondary"
                                            onClick={() =>
                                                setMode({ type: "edit", service })
                                            }
                                        >
                                            {t("common.edit")}
                                        </AppButton>
                                        <AppButton
                                            variant="destructive"
                                            onClick={() => handleDelete(service)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {t("common.delete")}
                                        </AppButton>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}
