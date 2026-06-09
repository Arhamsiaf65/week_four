import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";

import { registerSchema } from "../schemas/authSchemas";
import type { RegisterInput } from "../schemas/authSchemas";
import { useAuthStore } from "../store/authStore";
import { api } from "../../../services/axios";

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const showToast = useAuthStore((state) => state.showToast);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: RegisterInput) => {
            const response = await api.post("/auth", userData);
            return response.data;
        },
        onSuccess: (data) => {
            const token = data.data.accessToken;
            setAccessToken(token);
            
            // Invalidate 'me' query to fetch fresh profile
            queryClient.invalidateQueries({ queryKey: ["me"] });
            
            showToast("Welcome! Your account has been created.", "success");
            navigate("/dashboard");
        },
        onError: (error: any) => {
            const errMsg =
                error.response?.data?.message || "Registration failed. Please try again.";
            showToast(errMsg, "error");
        },
    });

    const onSubmit = (data: RegisterInput) => {
        // registerMutation.mutate(data);
        registerMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-surface-soft flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative backgrounds */}
            {/* <div className="absolute -top-40 -left-40 w-96 h-96 bg-burgundy-900/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none"></div> */}

            <div className="bg-surface border border-surface rounded-2xl p-8 w-full max-w-md shadow-xl relative z-10 transition-all hover:shadow-2xl hover:border-burgundy-900/20">
                
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Get Started</h1>
                <p className="text-sm text-surface-muted mb-8">
                    Create an account to join the Antigravity workspace.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2" htmlFor="name">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                className={`w-full bg-surface border ${errors.name ? "border-red-500 focus:ring-red-500/20" : "border-surface focus:border-burgundy-900 focus:ring-burgundy-900/20"} rounded-lg py-3 pr-4 pl-11 text-slate-100 text-sm transition-all focus:outline-none focus:ring-4 focus:bg-panel-alt`}
                                {...register("name")}
                            />
                            <UserIcon
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            />
                        </div>
                        {errors.name && (
                            <span className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1">
                                {errors.name.message}
                            </span>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className={`w-full bg-surface border ${errors.email ? "border-red-500 focus:ring-red-500/20" : "border-surface focus:border-burgundy-900 focus:ring-burgundy-900/20"} rounded-lg py-3 pr-4 pl-11 text-slate-100 text-sm transition-all focus:outline-none focus:ring-4 focus:bg-panel-alt`}
                                {...register("email")}
                            />
                            <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            />
                        </div>
                        {errors.email && (
                            <span className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1">
                                {errors.email.message}
                            </span>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••••••"
                                className={`w-full bg-surface border ${errors.password ? "border-red-500 focus:ring-red-500/20" : "border-surface focus:border-burgundy-900 focus:ring-burgundy-900/20"} rounded-lg py-3 pr-4 pl-11 text-slate-100 text-sm transition-all focus:outline-none focus:ring-4 focus:bg-panel-alt`}
                                {...register("password")}
                            />
                            <Lock
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            />
                        </div>
                        {errors.password && (
                            <span className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1">
                                {errors.password.message}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-primary mt-2"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Sign Up
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-surface-muted">
                    Already have an account?{" "}
                    <Link to="/login" className="text-gold-gradient font-semibold hover:text-burgundy-800 hover:underline transition-colors">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};
