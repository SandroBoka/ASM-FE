export type AppointmentStatus = "slobodan" | "zauzet" | "otkazan";

export type Appointment = {
    IdTermina: number;
    Datum: string;
    VrijemeOd: string;
    VrijemeDo: string;
    Status: AppointmentStatus;
};

export type AppointmentFreeFilter = {
    dateFrom?: string;
    dateTo?: string;
};

export type AppointmentCreatePayload = {
    Datum: string;
    VrijemeOd: string;
    VrijemeDo: string;
    Status?: AppointmentStatus;
};

export type AppointmentUpdatePayload = {
    Datum?: string;
    VrijemeOd?: string;
    VrijemeDo?: string;
    Status?: AppointmentStatus;
};
