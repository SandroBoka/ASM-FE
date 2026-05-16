import type { Service } from "../../services/models/serviceTypes";

export type ReservationStatus =
    | "na cekanju"
    | "odobrena"
    | "odbijena"
    | "otkazana"
    | "zavrsena";

export type ReservationServiceItem = {
    Kolicina: number;
    service: Service;
};

export type Reservation = {
    IdRezervacije: number;
    DatumKreiranja: string;
    Status: ReservationStatus;
    KilometrazaVozila: number;
    OpisProblema: string;
    KomentarZaposlenika: string | null;
    IdOsobe_Korisnik: number;
    IdTermina: number;
    IdVozila: number;
    IdOsobe_Zaposlenik: number | null;
    services: ReservationServiceItem[];
};

export type ReservationServiceItemPayload = {
    IdUsluge: number;
    Kolicina: number;
};

export type ReservationCreatePayload = {
    IdOsobe_Korisnik: number;
    IdTermina: number;
    IdVozila: number;
    KilometrazaVozila: number;
    OpisProblema: string;
    services: ReservationServiceItemPayload[];
};

export type ReservationActionPayload = {
    komentar?: string | null;
};
