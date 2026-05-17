export type Service = {
    IdUsluge: number;
    NazivUsluge: string;
    Opis: string | null;
    Trajanje: number;
    Cijena: string;
};

export type ServiceCreatePayload = {
    NazivUsluge: string;
    Opis: string | null;
    Trajanje: number;
    Cijena: number;
};

export type ServiceUpdatePayload = ServiceCreatePayload;
