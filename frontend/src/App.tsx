import React, { useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";

import { useAuthStore } from "./features/auth/store/authStore";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { queryClient } from "./services/queryClient";

// ─── PROTECTED ROUTE WRAPPER ──────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialLoading = useAuthStore((state) => state.isInitialLoading);

    if (isInitialLoading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
                <div className="loading-text">Authenticating Security Credentials...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// ─── AUTH REDIRECT WRAPPER (FOR LOGIN/REGISTER) ─────────────────────────────
const AuthRedirectRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialLoading = useAuthStore((state) => state.isInitialLoading);

    if (isInitialLoading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
                <div className="loading-text">Authenticating Security Credentials...</div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// ─── GLOBAL TOAST COMPONENT ──────────────────────────────────────────────────
const GlobalToast: React.FC = () => {
    const toast = useAuthStore((state) => state.toast);
    const hideToast = useAuthStore((state) => state.hideToast);

    if (!toast) return null;

    const renderIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckCircle2 size={18} style={{ color: "hsl(var(--accent-success))" }} />;
            case "error":
                return <AlertTriangle size={18} style={{ color: "hsl(var(--accent-danger))" }} />;
            default:
                return <Info size={18} style={{ color: "hsl(var(--primary))" }} />;
        }
    };

    return (
        <div className="toast-container">
            <div className={`toast toast-${toast.type}`} onClick={hideToast} style={{ cursor: "pointer" }}>
                {renderIcon()}
                <span>{toast.message}</span>
            </div>
        </div>
    );
};

// ─── CORE APP CONTAINER ──────────────────────────────────────────────────────
const AppContent: React.FC = () => {
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const setInitialLoading = useAuthStore((state) => state.setInitialLoading);
    const isInitialLoading = useAuthStore((state) => state.isInitialLoading);

    // Run silent refresh check on boot
    useEffect(() => {
        const attemptSilentRefresh = async () => {
            try {
                const response = await axios.post(
                    "http://localhost:5000/auth/refresh",
                    {},
                    { withCredentials: true }
                );
                const token = response.data.data.accessToken;
                setAccessToken(token);
            } catch (err) {
                clearAuth();
            } finally {
                setInitialLoading(false);
            }
        };

        attemptSilentRefresh();
    }, [setAccessToken, clearAuth, setInitialLoading]);

    if (isInitialLoading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
                <div className="loading-text">Synchronizing Active Workspace...</div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public Auth Routes */}
                <Route
                    path="/login"
                    element={
                        <AuthRedirectRoute>
                            <LoginPage />
                        </AuthRedirectRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <AuthRedirectRoute>
                            <RegisterPage />
                        </AuthRedirectRoute>
                    }
                />

                {/* Secure Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all Redirection */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Global toast notification system */}
            <GlobalToast />
        </Router>
    );
};

export const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AppContent />
        </QueryClientProvider>
    );
};

export default App;
