import { create } from "zustand";

interface ToastState {
    message: string;
    type: "success" | "error" | "info";
}

interface AuthState {
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitialLoading: boolean;
    toast: ToastState | null;
    setAccessToken: (token: string) => void;
    clearAuth: () => void;
    setInitialLoading: (loading: boolean) => void;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    hideToast: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isAuthenticated: false,
    isInitialLoading: true,
    toast: null,

    setAccessToken: (token: string) =>
        set({
            accessToken: token,
            isAuthenticated: true,
        }),

    clearAuth: () =>
        set({
            accessToken: null,
            isAuthenticated: false,
        }),

    setInitialLoading: (loading: boolean) =>
        set({
            isInitialLoading: loading,
        }),

    showToast: (message: string, type: "success" | "error" | "info" = "success") => {
        set({ toast: { message, type } });
        // Auto-dismiss toast in 4 seconds
        setTimeout(() => {
            set((state) => {
                if (state.toast?.message === message) {
                    return { toast: null };
                }
                return {};
            });
        }, 4000);
    },

    hideToast: () => set({ toast: null }),
}));
