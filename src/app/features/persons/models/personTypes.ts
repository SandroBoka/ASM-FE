export type Customer = {
    IdOsobe: number;
    Ime: string;
    Prezime: string;
    Email: string;
    Telefon: string | null;
};

export type Employee = Customer & {
    Uloga: "admin" | "serviser" | "voditelj";
};
