import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/axios";
import { useAuthStore } from "../store/authStore";

export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "viewer" | string;
    created_at: string;
}

interface MeResponse {
    success: boolean;
    data: User;
}

export const useMeQuery = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery<User, Error>({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<MeResponse>("/users/me");
              return response.data.data;
        },
        enabled: isAuthenticated, // Only run query when Zustand says we have an active access token
        staleTime: 10 * 60 * 1000, // 10 minutes cache
    });
};
