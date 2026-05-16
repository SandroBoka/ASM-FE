import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { router } from "./router/router";
import { AuthProvider } from "./features/auth/context/authContext";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
