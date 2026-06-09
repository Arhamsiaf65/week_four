import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
                // Do not retry 401/403/404 queries
                if (
                    error?.response?.status === 401 ||
                    error?.response?.status === 403 ||
                    error?.response?.status === 404
                ) {
                    return false;
                }
                return failureCount < 2;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});
