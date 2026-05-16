export type Vehicle = {
    IdVozila: number;
    IdOsobe: number;
    Marka: string;
    Model: string;
    Godina: number;
    VrstaMotora: string;
    RegOznaka: string;
};

export type VehicleCreatePayload = {
    IdOsobe: number;
    Marka: string;
    Model: string;
    Godina: number;
    VrstaMotora: string;
    RegOznaka: string;
};

export type VehicleUpdatePayload = {
    Marka?: string;
    Model?: string;
    Godina?: number;
    VrstaMotora?: string;
    RegOznaka?: string;
};
