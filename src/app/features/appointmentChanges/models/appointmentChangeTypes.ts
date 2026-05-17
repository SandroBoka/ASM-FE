export type AppointmentChangeStatus = "na cekanju" | "prihvacen" | "odbijen";

export type AppointmentChange = {
    IdZahtjevaPromjene: number;
    DatumZahtjeva: string;
    Status: AppointmentChangeStatus;
    KomentarZaposlenika: string | null;
    IdRezervacije: number;
    IdStarogTermina: number;
    IdNovogTermina: number;
    IdOsobe_Zaposlenik: number | null;
};

export type AppointmentChangeCreatePayload = {
    IdRezervacije: number;
    IdNovogTermina: number;
};

export type AppointmentChangeActionPayload = {
    komentar?: string | null;
};
