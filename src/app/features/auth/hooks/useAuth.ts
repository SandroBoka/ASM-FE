import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../context/authContext";

export function useAuth(): AuthContextValue {
    const value = useContext(AuthContext);

    if (!value) {
        throw new Error("useAuth se mora koristiti unutar AuthProvider.");
    }

    return value;
}
