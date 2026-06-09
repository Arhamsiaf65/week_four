import axios from "axios";
import { useAuthStore } from "../features/auth/store/authStore";

export const api = axios.create({
    baseURL: "https://weekfour-production.up.railway.app",
    withCredentials: true, // Crucial for httpOnly refresh cookies
});

// Request interceptor: Attach access token from Zustand
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Variables to handle multiple simultaneous 401s
    let isRefreshing = false;
    let failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (error: any) => void;
    }> = [];

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach((prom) => {
            if (token) {
                prom.resolve(token);
            } else {
                prom.reject(error);
            }
        });
        failedQueue = [];
    };

    // Response interceptor: Auto-refresh access token on 401 errors
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Skip refresh logic for auth endpoints
            if (
                originalRequest.url?.includes("/auth/login") ||
                originalRequest.url === "/auth/" ||
                originalRequest.url?.includes("/auth/refresh")
            ) {
                return Promise.reject(error);
            }

            // If 401 Unauthorized and not already retried
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    // Queue the request until token is refreshed
                    return new Promise((resolve, reject) => {
                        failedQueue.push({
                            resolve: (token: string) => {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                resolve(api(originalRequest));
                            },
                            reject: (err: any) => {
                                reject(err);
                            },
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    // Call refresh endpoint to get new access token from httpOnly cookie
                    const response = await axios.post(
                        "http://localhost:5000/auth/refresh",
                        {},
                        { withCredentials: true }
                    );

                    const newAccessToken = response.data.data.accessToken;

                    // Save to Zustand in-memory store
                    useAuthStore.getState().setAccessToken(newAccessToken);

                    // Update headers of the failed request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // Process queued requests
                    processQueue(null, newAccessToken);

                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed (e.g. refresh token expired or deleted)
                    processQueue(refreshError, null);
                    useAuthStore.getState().clearAuth();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
