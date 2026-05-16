import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import { useAuth } from "../../auth/hooks/useAuth";
import { useFreeAppointments } from "../../appointments/hooks/useAppointments";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import { useServices } from "../../services/hooks/useServices";
import type { Service } from "../../services/models/serviceTypes";
import { useVehiclesByCustomerId } from "../../vehicles/hooks/useVehicles";
import type { Vehicle } from "../../vehicles/models/vehicleTypes";
import { useCreateReservation } from "../hooks/useReservations";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type WizardState = {
    step: WizardStep;
    maxStepReached: WizardStep;
    appointmentId: number | null;
    vehicleId: number | null;
    kilometraza: string;
    opisProblema: string;
    selectedServices: Record<number, number>;
};

const INITIAL_STATE: WizardState = {
    step: 1,
    maxStepReached: 1,
    appointmentId: null,
    vehicleId: null,
    kilometraza: "",
    opisProblema: "",
    selectedServices: {},
};

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}.`;
}

function formatTimeRange(from: string, to: string): string {
    return `${from.slice(0, 5)}–${to.slice(0, 5)}`;
}

function durationInMinutes(from: string, to: string): number {
    const [fromHours, fromMinutes] = from.split(":").map(Number);
    const [toHours, toMinutes] = to.split(":").map(Number);
    return toHours * 60 + toMinutes - (fromHours * 60 + fromMinutes);
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
    const [state, setState] = useState<WizardState>(INITIAL_STATE);
    const today = useMemo(() => toIsoDate(new Date()), []);
    const defaultDateTo = useMemo(() => {
        const future = new Date();
        future.setDate(future.getDate() + 14);
        return toIsoDate(future);
    }, []);
    const [dateFrom, setDateFrom] = useState<string>(today);
    const [dateTo, setDateTo] = useState<string>(defaultDateTo);

    const createMutation = useCreateReservation();
    const servicesQuery = useServices();
    const vehiclesQuery = useVehiclesByCustomerId(user?.IdOsobe ?? null);
    const appointmentsQuery = useFreeAppointments(
        { dateFrom, dateTo },
        Boolean(user) && state.step === 1,
    );

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

    function updateState(patch: Partial<WizardState>) {
        setState((prev) => ({ ...prev, ...patch }));
    }

    function goToStep(step: WizardStep) {
        setState((prev) => ({
            ...prev,
            step,
            maxStepReached: (step > prev.maxStepReached ? step : prev.maxStepReached) as WizardStep,
        }));
    }

    const selectedAppointment =
        appointmentsQuery.data?.find((a) => a.IdTermina === state.appointmentId) ?? null;
    const selectedVehicle =
        vehiclesQuery.data?.find((v) => v.IdVozila === state.vehicleId) ?? null;
    const selectedServicesList = useMemo(() => {
        if (!servicesQuery.data) {
            return [] as { service: Service; quantity: number }[];
        }
        return Object.entries(state.selectedServices)
            .map(([id, quantity]) => {
                const service = servicesQuery.data!.find(
                    (s) => s.IdUsluge === Number(id),
                );
                return service ? { service, quantity } : null;
            })
            .filter((entry): entry is { service: Service; quantity: number } => entry !== null);
    }, [servicesQuery.data, state.selectedServices]);

    const totals = useMemo(() => {
        return selectedServicesList.reduce(
            (acc, { service, quantity }) => ({
                duration: acc.duration + service.Trajanje * quantity,
                price: acc.price + Number(service.Cijena) * quantity,
            }),
            { duration: 0, price: 0 },
        );
    }, [selectedServicesList]);

    async function handleSubmit() {
        if (!state.appointmentId || !state.vehicleId) {
            return;
        }
        const kilometers = Number.parseInt(state.kilometraza, 10);
        if (Number.isNaN(kilometers) || kilometers < 0) {
            return;
        }
        await createMutation.mutateAsync({
            IdOsobe_Korisnik: user!.IdOsobe,
            IdTermina: state.appointmentId,
            IdVozila: state.vehicleId,
            KilometrazaVozila: kilometers,
            OpisProblema: state.opisProblema.trim(),
            services: Object.entries(state.selectedServices).map(([id, qty]) => ({
                IdUsluge: Number(id),
                Kolicina: qty,
            })),
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
                        <AppButton
                            variant="secondary"
                            onClick={() => {
                                createMutation.reset();
                                setState(INITIAL_STATE);
                            }}
                        >
                            {t("reservations.newAnother")}
                        </AppButton>
                    </div>
                </section>
            </section>
        );
    }

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("reservations.newTitle")}</h1>
            </header>

            <StepIndicator
                currentStep={state.step}
                maxStepReached={state.maxStepReached}
                onStepClick={goToStep}
            />

            {state.step === 1 ? (
                <Step1Appointment
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    appointments={appointmentsQuery.data ?? []}
                    isLoading={appointmentsQuery.isLoading}
                    error={appointmentsQuery.error}
                    selectedAppointmentId={state.appointmentId}
                    onSelectAppointment={(id) => updateState({ appointmentId: id })}
                    onNext={() => goToStep(2)}
                />
            ) : null}

            {state.step === 2 ? (
                <Step2Vehicle
                    vehicles={vehiclesQuery.data ?? []}
                    isLoading={vehiclesQuery.isLoading}
                    error={vehiclesQuery.error}
                    selectedVehicleId={state.vehicleId}
                    onSelectVehicle={(id) => updateState({ vehicleId: id })}
                    onBack={() => goToStep(1)}
                    onNext={() => goToStep(3)}
                />
            ) : null}

            {state.step === 3 ? (
                <Step3Details
                    kilometraza={state.kilometraza}
                    opisProblema={state.opisProblema}
                    onKilometrazaChange={(value) => updateState({ kilometraza: value })}
                    onOpisProblemaChange={(value) => updateState({ opisProblema: value })}
                    onBack={() => goToStep(2)}
                    onNext={() => goToStep(4)}
                />
            ) : null}

            {state.step === 4 ? (
                <Step4Services
                    services={servicesQuery.data ?? []}
                    isLoading={servicesQuery.isLoading}
                    error={servicesQuery.error}
                    selectedServices={state.selectedServices}
                    appointment={selectedAppointment}
                    totalDuration={totals.duration}
                    onToggleService={(serviceId, quantity) =>
                        updateState({
                            selectedServices: quantity > 0
                                ? { ...state.selectedServices, [serviceId]: quantity }
                                : Object.fromEntries(
                                    Object.entries(state.selectedServices).filter(
                                        ([id]) => Number(id) !== serviceId,
                                    ),
                                ),
                        })
                    }
                    onBack={() => goToStep(3)}
                    onNext={() => goToStep(5)}
                />
            ) : null}

            {state.step === 5 ? (
                <Step5Summary
                    appointment={selectedAppointment}
                    vehicle={selectedVehicle}
                    kilometraza={state.kilometraza}
                    opisProblema={state.opisProblema}
                    services={selectedServicesList}
                    totalDuration={totals.duration}
                    totalPrice={totals.price}
                    onBack={() => goToStep(4)}
                    onSubmit={handleSubmit}
                    isSubmitting={createMutation.isPending}
                    errorMessage={
                        createMutation.error
                            ? getErrorMessage(createMutation.error, t("common.unknownError"))
                            : null
                    }
                />
            ) : null}
        </section>
    );
}

type StepIndicatorProps = {
    currentStep: WizardStep;
    maxStepReached: WizardStep;
    onStepClick: (step: WizardStep) => void;
};

function StepIndicator({ currentStep, maxStepReached, onStepClick }: StepIndicatorProps) {
    const { t } = useTranslation();
    const steps: { id: WizardStep; key: string }[] = [
        { id: 1, key: "reservations.wizard.step1Title" },
        { id: 2, key: "reservations.wizard.step2Title" },
        { id: 3, key: "reservations.wizard.step3Title" },
        { id: 4, key: "reservations.wizard.step4Title" },
        { id: 5, key: "reservations.wizard.step5Title" },
    ];
    return (
        <ol className="wizard-steps">
            {steps.map((step) => {
                const isReachable = step.id <= maxStepReached;
                const modifier =
                    step.id === currentStep
                        ? "wizard-steps__item--current"
                        : step.id < currentStep
                          ? "wizard-steps__item--done"
                          : "";
                return (
                    <li key={step.id}>
                        <button
                            type="button"
                            className={`wizard-steps__item ${modifier}`}
                            disabled={!isReachable}
                            onClick={() => onStepClick(step.id)}
                        >
                            <span className="wizard-steps__number">{step.id}</span>
                            <span className="wizard-steps__label">{t(step.key)}</span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}

type Step1Props = {
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    appointments: Appointment[];
    isLoading: boolean;
    error: unknown;
    selectedAppointmentId: number | null;
    onSelectAppointment: (id: number) => void;
    onNext: () => void;
};

function Step1Appointment({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    appointments,
    isLoading,
    error,
    selectedAppointmentId,
    onSelectAppointment,
    onNext,
}: Step1Props) {
    const { t } = useTranslation();
    return (
        <section className="page__section">
            <h2>{t("reservations.wizard.step1Title")}</h2>

            <div className="wizard-filters">
                <AppTextField
                    label={t("reservations.wizard.dateFrom")}
                    name="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => onDateFromChange(event.target.value)}
                />
                <AppTextField
                    label={t("reservations.wizard.dateTo")}
                    name="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(event) => onDateToChange(event.target.value)}
                />
            </div>

            {isLoading ? <p>{t("common.loading")}</p> : null}

            {error ? (
                <Alert variant="error">
                    {getErrorMessage(error, t("common.unknownError"))}
                </Alert>
            ) : null}

            {!isLoading && appointments.length === 0 ? (
                <Alert variant="info">{t("reservations.wizard.noAppointments")}</Alert>
            ) : null}

            {appointments.length > 0 ? (
                <ul className="appointment-list">
                    {appointments.map((appointment) => {
                        const selected = appointment.IdTermina === selectedAppointmentId;
                        return (
                            <li key={appointment.IdTermina}>
                                <button
                                    type="button"
                                    className={`appointment-list__item ${
                                        selected ? "appointment-list__item--selected" : ""
                                    }`}
                                    onClick={() => onSelectAppointment(appointment.IdTermina)}
                                >
                                    <span className="appointment-list__date">
                                        {formatDate(appointment.Datum)}
                                    </span>
                                    <span className="appointment-list__time">
                                        {formatTimeRange(
                                            appointment.VrijemeOd,
                                            appointment.VrijemeDo,
                                        )}
                                        {" · "}
                                        {t("services.durationMinutes", {
                                            minutes: durationInMinutes(
                                                appointment.VrijemeOd,
                                                appointment.VrijemeDo,
                                            ),
                                        })}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <div className="form-actions form-actions--end">
                <AppButton
                    onClick={onNext}
                    disabled={selectedAppointmentId === null}
                >
                    {t("reservations.wizard.next")}
                </AppButton>
            </div>
        </section>
    );
}

type Step2Props = {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: unknown;
    selectedVehicleId: number | null;
    onSelectVehicle: (id: number) => void;
    onBack: () => void;
    onNext: () => void;
};

function Step2Vehicle({
    vehicles,
    isLoading,
    error,
    selectedVehicleId,
    onSelectVehicle,
    onBack,
    onNext,
}: Step2Props) {
    const { t } = useTranslation();
    return (
        <section className="page__section">
            <h2>{t("reservations.wizard.step2Title")}</h2>

            {isLoading ? <p>{t("common.loading")}</p> : null}

            {error ? (
                <Alert variant="error">
                    {getErrorMessage(error, t("common.unknownError"))}
                </Alert>
            ) : null}

            {!isLoading && vehicles.length === 0 ? (
                <Alert variant="info">
                    {t("reservations.wizard.noVehicles")}{" "}
                    <Link to="/vehicles">{t("reservations.wizard.addVehicleLink")}</Link>
                </Alert>
            ) : null}

            {vehicles.length > 0 ? (
                <ul className="vehicle-list">
                    {vehicles.map((vehicle) => {
                        const selected = vehicle.IdVozila === selectedVehicleId;
                        return (
                            <li
                                key={vehicle.IdVozila}
                                className={`vehicle-list__item ${
                                    selected ? "vehicle-list__item--selected" : ""
                                }`}
                            >
                                <div>
                                    <strong>
                                        {vehicle.Marka} {vehicle.Model}
                                    </strong>{" "}
                                    ({vehicle.Godina})
                                    <div>
                                        {vehicle.RegOznaka} · {vehicle.VrstaMotora}
                                    </div>
                                </div>
                                <AppButton
                                    variant={selected ? "primary" : "secondary"}
                                    onClick={() => onSelectVehicle(vehicle.IdVozila)}
                                >
                                    {selected
                                        ? t("reservations.wizard.selected")
                                        : t("reservations.wizard.select")}
                                </AppButton>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <div className="form-actions form-actions--between">
                <AppButton variant="secondary" onClick={onBack}>
                    {t("reservations.wizard.back")}
                </AppButton>
                <AppButton onClick={onNext} disabled={selectedVehicleId === null}>
                    {t("reservations.wizard.next")}
                </AppButton>
            </div>
        </section>
    );
}

type Step3Props = {
    kilometraza: string;
    opisProblema: string;
    onKilometrazaChange: (value: string) => void;
    onOpisProblemaChange: (value: string) => void;
    onBack: () => void;
    onNext: () => void;
};

function Step3Details({
    kilometraza,
    opisProblema,
    onKilometrazaChange,
    onOpisProblemaChange,
    onBack,
    onNext,
}: Step3Props) {
    const { t } = useTranslation();
    const [validationError, setValidationError] = useState<string | null>(null);

    function handleNext() {
        const kmNumber = Number.parseInt(kilometraza, 10);
        if (Number.isNaN(kmNumber) || kmNumber < 0) {
            setValidationError(t("reservations.validation.kilometersInvalid"));
            return;
        }
        if (opisProblema.trim() === "") {
            setValidationError(t("reservations.validation.descriptionRequired"));
            return;
        }
        setValidationError(null);
        onNext();
    }

    return (
        <section className="page__section">
            <h2>{t("reservations.wizard.step3Title")}</h2>

            <form className="form">
                <AppTextField
                    label={t("reservations.fields.kilometers")}
                    name="kilometraza"
                    type="number"
                    min={0}
                    value={kilometraza}
                    onChange={(event) => onKilometrazaChange(event.target.value)}
                    placeholder="125000"
                    required
                />
                <label className="ui-field">
                    <span className="ui-field__label">
                        {t("reservations.fields.problemDescription")}
                    </span>
                    <textarea
                        className="ui-field__input"
                        name="opisProblema"
                        rows={4}
                        value={opisProblema}
                        onChange={(event) => onOpisProblemaChange(event.target.value)}
                        required
                    />
                </label>
                {validationError ? (
                    <Alert variant="error">{validationError}</Alert>
                ) : null}
            </form>

            <div className="form-actions form-actions--between">
                <AppButton variant="secondary" onClick={onBack}>
                    {t("reservations.wizard.back")}
                </AppButton>
                <AppButton onClick={handleNext}>
                    {t("reservations.wizard.next")}
                </AppButton>
            </div>
        </section>
    );
}

type Step4Props = {
    services: Service[];
    isLoading: boolean;
    error: unknown;
    selectedServices: Record<number, number>;
    appointment: Appointment | null;
    totalDuration: number;
    onToggleService: (serviceId: number, quantity: number) => void;
    onBack: () => void;
    onNext: () => void;
};

function Step4Services({
    services,
    isLoading,
    error,
    selectedServices,
    appointment,
    totalDuration,
    onToggleService,
    onBack,
    onNext,
}: Step4Props) {
    const { t } = useTranslation();
    const slotDuration = appointment
        ? durationInMinutes(appointment.VrijemeOd, appointment.VrijemeDo)
        : null;
    const exceedsSlot =
        slotDuration !== null && totalDuration > 0 && totalDuration > slotDuration;

    return (
        <section className="page__section">
            <h2>{t("reservations.wizard.step4Title")}</h2>
            <p className="muted-hint">{t("reservations.wizard.step4Hint")}</p>

            {exceedsSlot && slotDuration !== null ? (
                <Alert variant="error">
                    {t("reservations.validation.durationExceedsSlot", {
                        total: totalDuration,
                        slot: slotDuration,
                    })}
                </Alert>
            ) : null}

            {isLoading ? <p>{t("common.loading")}</p> : null}

            {error ? (
                <Alert variant="error">
                    {getErrorMessage(error, t("common.unknownError"))}
                </Alert>
            ) : null}

            {!isLoading && services.length === 0 ? (
                <Alert variant="info">{t("services.empty")}</Alert>
            ) : null}

            {services.length > 0 ? (
                <ul className="service-pick-list">
                    {services.map((service) => {
                        const selected = service.IdUsluge in selectedServices;
                        const quantity = selectedServices[service.IdUsluge] ?? 0;
                        return (
                            <li key={service.IdUsluge} className="service-pick-list__item">
                                <label className="service-pick-list__check">
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={(event) =>
                                            onToggleService(
                                                service.IdUsluge,
                                                event.target.checked ? 1 : 0,
                                            )
                                        }
                                    />
                                    <div>
                                        <strong>{service.NazivUsluge}</strong>
                                        <div className="service-pick-list__meta">
                                            {t("services.durationMinutes", {
                                                minutes: service.Trajanje,
                                            })}{" "}
                                            ·{" "}
                                            {t("services.priceFormatted", {
                                                price: Number(service.Cijena).toFixed(2),
                                            })}
                                        </div>
                                    </div>
                                </label>
                                {selected ? (
                                    <div className="service-pick-list__quantity">
                                        <span className="ui-field__label">
                                            {t("reservations.wizard.quantity")}
                                        </span>
                                        <input
                                            className="ui-field__input"
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(event) => {
                                                const value = Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                );
                                                onToggleService(
                                                    service.IdUsluge,
                                                    Number.isNaN(value) || value < 1 ? 1 : value,
                                                );
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <div className="form-actions form-actions--between">
                <AppButton variant="secondary" onClick={onBack}>
                    {t("reservations.wizard.back")}
                </AppButton>
                <AppButton onClick={onNext}>
                    {t("reservations.wizard.next")}
                </AppButton>
            </div>
        </section>
    );
}

type Step5Props = {
    appointment: Appointment | null;
    vehicle: Vehicle | null;
    kilometraza: string;
    opisProblema: string;
    services: { service: Service; quantity: number }[];
    totalDuration: number;
    totalPrice: number;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    errorMessage: string | null;
};

function Step5Summary({
    appointment,
    vehicle,
    kilometraza,
    opisProblema,
    services,
    totalDuration,
    totalPrice,
    onBack,
    onSubmit,
    isSubmitting,
    errorMessage,
}: Step5Props) {
    const { t } = useTranslation();
    return (
        <section className="page__section">
            <h2>{t("reservations.wizard.step5Title")}</h2>

            <dl className="summary">
                <dt>{t("reservations.fields.appointment")}</dt>
                <dd>
                    {appointment
                        ? `${formatDate(appointment.Datum)} · ${formatTimeRange(
                              appointment.VrijemeOd,
                              appointment.VrijemeDo,
                          )} · ${durationInMinutes(
                              appointment.VrijemeOd,
                              appointment.VrijemeDo,
                          )} min`
                        : "—"}
                </dd>

                <dt>{t("reservations.fields.vehicle")}</dt>
                <dd>
                    {vehicle
                        ? `${vehicle.Marka} ${vehicle.Model} (${vehicle.RegOznaka})`
                        : "—"}
                </dd>

                <dt>{t("reservations.fields.kilometers")}</dt>
                <dd>{kilometraza ? `${kilometraza} km` : "—"}</dd>

                <dt>{t("reservations.fields.problemDescription")}</dt>
                <dd>{opisProblema || "—"}</dd>

                <dt>{t("reservations.fields.services")}</dt>
                <dd>
                    {services.length === 0 ? (
                        "—"
                    ) : (
                        <ul className="summary__services">
                            {services.map(({ service, quantity }) => (
                                <li key={service.IdUsluge}>
                                    {service.NazivUsluge} × {quantity}
                                </li>
                            ))}
                        </ul>
                    )}
                </dd>

                {services.length > 0 ? (
                    <>
                        <dt>{t("reservations.fields.totalDuration")}</dt>
                        <dd>{t("services.durationMinutes", { minutes: totalDuration })}</dd>

                        <dt>{t("reservations.fields.totalPrice")}</dt>
                        <dd>
                            {t("services.priceFormatted", {
                                price: totalPrice.toFixed(2),
                            })}
                        </dd>
                    </>
                ) : null}
            </dl>

            {(() => {
                const slotDuration = appointment
                    ? durationInMinutes(appointment.VrijemeOd, appointment.VrijemeDo)
                    : null;
                const exceedsSlot =
                    slotDuration !== null && totalDuration > 0 && totalDuration > slotDuration;

                return (
                    <>
                        {exceedsSlot && slotDuration !== null ? (
                            <Alert variant="error">
                                {t("reservations.validation.durationExceedsSlot", {
                                    total: totalDuration,
                                    slot: slotDuration,
                                })}
                            </Alert>
                        ) : null}

                        {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

                        <div className="form-actions form-actions--between">
                            <AppButton
                                variant="secondary"
                                onClick={onBack}
                                disabled={isSubmitting}
                            >
                                {t("reservations.wizard.back")}
                            </AppButton>
                            <AppButton
                                onClick={onSubmit}
                                disabled={isSubmitting || exceedsSlot}
                            >
                                {isSubmitting
                                    ? t("reservations.wizard.submitting")
                                    : t("reservations.wizard.submit")}
                            </AppButton>
                        </div>
                    </>
                );
            })()}
        </section>
    );
}
