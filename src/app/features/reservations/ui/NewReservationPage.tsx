import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { useAuth } from "../../auth/hooks/useAuth";
import { useFreeAppointments } from "../../appointments/hooks/useAppointments";
import { useServices } from "../../services/hooks/useServices";
import { useVehiclesByCustomerId } from "../../vehicles/hooks/useVehicles";
import { useCreateReservation } from "../hooks/useReservations";
import { ReservationForm, type ReservationFormValues } from "./ReservationForm";

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

export function NewReservationPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    const today = useMemo(() => toIsoDate(new Date()), []);
    const defaultDateTo = useMemo(() => {
        const future = new Date();
        future.setDate(future.getDate() + 14);
        return toIsoDate(future);
    }, []);
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(defaultDateTo);

    const createMutation = useCreateReservation();
    const appointmentsQuery = useFreeAppointments(
        { dateFrom, dateTo },
        Boolean(user) && user?.TipKorisnika === "customer",
    );
    const vehiclesQuery = useVehiclesByCustomerId(user?.IdOsobe ?? null);
    const servicesQuery = useServices();

    if (!user) {
        return null;
    }

    if (user.TipKorisnika !== "customer") {
        return (
            <section className="page">
                <h1>{t("reservations.newTitle")}</h1>
                <Alert variant="info">{t("reservations.customerOnly")}</Alert>
            </section>
        );
    }

    async function handleSubmit(values: ReservationFormValues) {
        await createMutation.mutateAsync({
            IdOsobe_Korisnik: user!.IdOsobe,
            ...values,
        });
    }

    if (createMutation.isSuccess) {
        return (
            <section className="page">
                <header className="page__header">
                    <h1>{t("reservations.newTitle")}</h1>
                </header>
                <section className="page__section">
                    <Alert variant="info">{t("reservations.successMessage")}</Alert>
                    <div className="form-actions">
                        <AppButton onClick={() => navigate("/reservations")}>
                            {t("reservations.viewMine")}
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => createMutation.reset()}>
                            {t("reservations.newAnother")}
                        </AppButton>
                    </div>
                </section>
            </section>
        );
    }

    const isLoadingData =
        appointmentsQuery.isLoading || vehiclesQuery.isLoading || servicesQuery.isLoading;

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("reservations.newTitle")}</h1>
            </header>

            <ReservationForm
                mode="create"
                appointments={appointmentsQuery.data ?? []}
                vehicles={vehiclesQuery.data ?? []}
                services={servicesQuery.data ?? []}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                isLoadingData={isLoadingData}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
                errorMessage={
                    createMutation.error
                        ? getErrorMessage(createMutation.error, t("common.unknownError"))
                        : null
                }
                onCancel={() => navigate("/reservations")}
            />
        </section>
    );
}
