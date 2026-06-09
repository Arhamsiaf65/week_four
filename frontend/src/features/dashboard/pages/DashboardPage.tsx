import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    User as UserIcon,
    Shield,
    LogOut,
    Trash2,
    Edit,
    Plus,
    Loader2,
} from "lucide-react";

import { useMeQuery } from "../../auth/hooks/useMeQuery";
import type { User } from "../../auth/hooks/useMeQuery";
import { useAuthStore } from "../../auth/store/authStore";
import { api } from "../../../services/axios";
import ModalWrapper from "../../../components/ModalWrapper";
import ConfirmDialog from "../../../components/ConfirmDialog";
import UserForm from "../../../components/UserForm";
import { ChatRoom } from "../../chat/ChatRoom";

// ─── ZOD SCHEMAS FOR DASHBOARD FORMS ──────────────────────────────────────────

const updateSelfSchema = z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(50),
});
type UpdateSelfInput = z.infer<typeof updateSelfSchema>;

const adminCreateUserSchema = z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(50),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["admin", "editor", "viewer"]),
});
type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

const adminUpdateUserSchema = z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(50),
    role: z.enum(["admin", "editor", "viewer"]),
});
type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const showToast = useAuthStore((state) => state.showToast);

    // Modals & Active Edit Selection State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editUserTarget, setEditUserTarget] = useState<User | null>(null);
    const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
    const [isDeleteSelfOpen, setIsDeleteSelfOpen] = useState(false);

    // ─── 1. CORE QUERIES ───────────────────────────────────────────────────────
    // A. Current User Query
    const { data: me, isLoading: isMeLoading } = useMeQuery();

    // B. Admin ONLY: Fetch All Users
    const isAdmin = me?.role === "admin";
    const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: User[] }>("/users");
            return response.data.data;
        },
        enabled: isAdmin,
    });

    // ─── 2. REACT HOOK FORMS ──────────────────────────────────────────────────
    // A. Self update form
    const {
        register: registerSelf,
        handleSubmit: handleSubmitSelf,
        formState: { errors: selfErrors },
    } = useForm<UpdateSelfInput>({
        resolver: zodResolver(updateSelfSchema),
        values: me ? { name: me.name } : undefined,
    });

    // B. Admin Create/Edit forms were refactored into `UserForm` component

    // ─── 3. MUTATIONS ──────────────────────────────────────────────────────────

    // A. Logout Mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await api.post("/auth/logout");
        },
        onSuccess: () => {
            clearAuth();
            queryClient.clear();
            showToast("Successfully logged out.", "success");
            navigate("/login");
        },
        onError: () => {
            clearAuth();
            queryClient.clear();
            navigate("/login");
        },
    });

    // B. Update Self Profile Mutation
    const updateSelfMutation = useMutation({
        mutationFn: async (payload: UpdateSelfInput) => {
            const response = await api.patch("/users/me", payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            showToast("Profile name updated successfully!", "success");
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || "Failed to update profile.", "error");
        },
    });

    // C. Delete Self Profile Mutation (Destructive)
    const deleteSelfMutation = useMutation({
        mutationFn: async () => {
            await api.delete("/users/me");
        },
        onSuccess: () => {
            clearAuth();
            queryClient.clear();
            showToast("Your account has been deleted.", "success");
            navigate("/login");
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || "Failed to delete account.", "error");
        },
    });

    // D. Admin: Create User Mutation
    const adminCreateMutation = useMutation({
        mutationFn: async (payload: AdminCreateUserInput) => {
            const response = await api.post("/users", payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsAddModalOpen(false);
            showToast("New user successfully created!", "success");
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || "Failed to create user.", "error");
        },
    });

    // E. Admin: Update User Mutation
    const adminUpdateMutation = useMutation({
        mutationFn: async (payload: AdminUpdateUserInput) => {
            if (!editUserTarget) return;
            const response = await api.patch(`/users/${editUserTarget.id}`, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            // If admin updated their own details, invalidate self too
            if (editUserTarget?.id === me?.id) {
                queryClient.invalidateQueries({ queryKey: ["me"] });
            }
            setEditUserTarget(null);
            showToast("User details successfully updated!", "success");
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || "Failed to update user.", "error");
        },
    });

    // F. Admin: Delete User Mutation
    const adminDeleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setDeleteUserTarget(null);
            showToast("User has been deleted.", "success");
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || "Failed to delete user.", "error");
        },
    });

    // ─── 4. HANDLERS ──────────────────────────────────────────────────────────

    const handleUpdateSelf = (data: UpdateSelfInput) => {
        updateSelfMutation.mutate(data);
    };

    const handleAdminCreate = (data: AdminCreateUserInput) => {
        adminCreateMutation.mutate(data);
    };

    const handleAdminUpdate = (data: AdminUpdateUserInput) => {
        adminUpdateMutation.mutate(data);
    };

    const handleDeleteSelfConfirm = () => {
        deleteSelfMutation.mutate();
    };

    // Loader display while me is mounting
    if (isMeLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-surface border-t-burgundy-900 rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-surface-muted tracking-wide">Synchronizing Secure Session...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-soft flex flex-col relative overflow-x-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-burgundy-900/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-40 -right-40 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-surface-strong backdrop-blur-lg border-b border-surface px-10 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-100">
                    <span className="brand-logo text-3xl">Auth Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-panel-alt px-3 py-1.5 rounded-full border border-surface text-sm font-semibold text-slate-100 shadow-sm">
                        <UserIcon size={14} className="text-burgundy-900" />
                        <span>{me?.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${me?.role === "admin" ? "bg-burgundy-100 text-burgundy-900 border border-burgundy-200" : "bg-gold-100 text-gold-700 border border-gold-200"}`}>
                            {me?.role}
                        </span>
                    </div>
                    <button
                        className="p-2 text-surface-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        title="Sign Out"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* Dashboard Main Workspace */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10 relative z-10">
                <div className="mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Control Hub</h2>
                    <p className="text-surface-muted">
                        Logged in as <strong className="text-slate-100 font-semibold">{me?.email}</strong>. Manage your profile or administrative privileges.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
                    {/* Sidebar Panel: Profile Operations */}
                    <div className="flex flex-col gap-8">
                        <div className="bg-surface-strong border border-surface rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[rgba(255,255,255,0.08)]">
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    <UserIcon size={18} className="text-burgundy-900" />
                                    Your Profile
                                </h3>
                            </div>

                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Identity</span>
                                    <span className="text-sm font-mono text-slate-100 bg-panel-alt px-2 py-1 rounded border border-[rgba(255,255,255,0.08)]">
                                        {me?.id}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</span>
                                    <span className="text-slate-100 font-medium">{me?.name}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</span>
                                    <span className="text-slate-100 font-medium">{me?.email}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">System Role</span>
                                    <span className="text-slate-100 font-medium capitalize">{me?.role}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Created</span>
                                    <span className="text-slate-100 font-medium">
                                        {me ? new Date(me.created_at).toLocaleDateString(undefined, { dateStyle: "long" }) : ""}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitSelf(handleUpdateSelf)} className="pt-5 border-t border-surface space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2" htmlFor="self-name">
                                        Update Display Name
                                    </label>
                                    <input
                                        id="self-name"
                                        type="text"
                                        className="w-full bg-surface border border-surface focus:border-gold-600 focus:ring-4 focus:ring-gold-600/20 rounded-lg py-2.5 px-3 text-slate-100 text-sm transition-all focus:outline-none"
                                        placeholder="Full Name"
                                        {...registerSelf("name")}
                                    />
                                    {selfErrors.name && <span className="text-red-500 text-xs font-medium mt-1">{selfErrors.name.message}</span>}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 bg-panel-alt text-slate-100 hover:bg-surface-soft border border-surface font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={updateSelfMutation.isPending}
                                >
                                    {updateSelfMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Save Name"
                                    )}
                                </button>
                            </form>

                            <button
                                className="w-full mt-6 flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100 hover:border-red-600 font-semibold py-2.5 px-4 rounded-lg transition-all"
                                onClick={() => setIsDeleteSelfOpen(true)}
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* Main Panel: Conditional Admin Panel */}
                    <div className="flex flex-col gap-8">
                        {isAdmin ? (
                            <div className="bg-surface-strong border border-surface rounded-2xl p-6 shadow-md">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[rgba(255,255,255,0.08)]">
                                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                        <Shield size={18} className="text-burgundy-900" />
                                        User Management Console
                                    </h3>
                                    <button className="btn-primary text-sm" onClick={() => setIsAddModalOpen(true)}>
                                        <Plus size={16} />
                                        Create New User
                                    </button>
                                </div>

                                {isUsersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <div className="w-8 h-8 border-4 border-surface border-t-burgundy-900 rounded-full animate-spin"></div>
                                        <span className="text-sm text-surface-muted">Fetching active directories...</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-surface rounded-xl ">
                                        <table className="w-full  text-left text-sm whitespace-nowrap">
                                            <thead className="bg-surface border-b border-surface text-surface-muted text-xs uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Name</th>
                                                    <th className="px-6 py-4">Email</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Created At</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                                                {users.map((u) => (
                                                    <tr key={u.id} className="bg-surface-strong transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                                                                {u.name} 
                                                                {u.id === me?.id && <span className="text-burgundy-900 text-xs font-normal bg-burgundy-50 px-2 py-0.5 rounded-full">(you)</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-surface-muted">{u.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${u.role === "admin" ? "bg-burgundy-100 text-burgundy-900 border border-burgundy-200" : "bg-gold-100 text-gold-700 border border-gold-200"}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-300">
                                                            {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    className="p-1.5 text-slate-400 hover:text-burgundy-900 hover:bg-burgundy-50 rounded border border-transparent hover:border-burgundy-200 transition-colors"
                                                                    title="Edit User"
                                                                    onClick={() => setEditUserTarget(u)}
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-slate-400"
                                                                    title="Delete User"
                                                                    disabled={u.id === me?.id}
                                                                    onClick={() => setDeleteUserTarget(u)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-surface-strong border-2 border-dashed border-surface rounded-2xl flex flex-col p-12 items-center justify-center text-center">
                                <h3 className="text-xl font-bold text-slate-100 mb-2">Viewer Panel Only</h3>
                                <p className="text-surface-muted max-w-md">
                                    Administrative capabilities are reserved for administrators. Your account currently holds the <strong className="text-slate-100">viewer</strong> role. Reach out to an administrator if you require elevated privileges.
                                </p>
                            </div>
                        )}
                        <ChatRoom userName={me?.name || "Anonymous"} />
                    </div>
                </div>
            </main>

            {/* ─── 5. MODALS & DIALOGS ────────────────────────────────────────────────── */}

            {/* A. Modal: Admin Create User (refactored) */}
            {isAddModalOpen && (
                <ModalWrapper title="Create User" onClose={() => setIsAddModalOpen(false)}>
                    <UserForm
                        mode="create"
                        onSubmit={(data) => handleAdminCreate(data as AdminCreateUserInput)}
                        isSubmitting={adminCreateMutation.isPending}
                    />
                </ModalWrapper>
            )}

            {/* B. Modal: Admin Edit User (refactored) */}
            {editUserTarget && (
                <ModalWrapper title="Edit User Details" onClose={() => setEditUserTarget(null)}>
                    <UserForm
                        mode="edit"
                        defaultValues={{ name: editUserTarget.name, email: editUserTarget.email, role: editUserTarget.role as any }}
                        onSubmit={(data) => handleAdminUpdate({ name: data.name, role: data.role })}
                        isSubmitting={adminUpdateMutation.isPending}
                    />
                </ModalWrapper>
            )}

            {/* C. Modal: Admin Delete User Confirm (refactored) */}
            {deleteUserTarget && (
                <ConfirmDialog
                    title="Remove Account?"
                    description={(
                        <>
                            Are you absolutely sure you want to delete <strong className="text-slate-100">{deleteUserTarget.name}</strong> ({deleteUserTarget.email})? This action is completely permanent and cannot be undone.
                        </>
                    )}
                    confirmLabel="Confirm Delete"
                    onCancel={() => setDeleteUserTarget(null)}
                    onConfirm={() => adminDeleteMutation.mutate(deleteUserTarget.id)}
                    isProcessing={adminDeleteMutation.isPending}
                />
            )}

            {/* D. Modal: Self Delete Confirm (refactored) */}
            {isDeleteSelfOpen && (
                <ConfirmDialog
                    title="Terminate Your Workspace?"
                    description={(
                        <>
                            Are you absolutely sure you want to delete your profile? All of your credentials, refresh tokens, and active sessions will be completely scrubbed from the active directories. This cannot be reverted.
                        </>
                    )}
                    confirmLabel="Scrub Workspace"
                    cancelLabel="Keep Profile"
                    onCancel={() => setIsDeleteSelfOpen(false)}
                    onConfirm={handleDeleteSelfConfirm}
                    isProcessing={deleteSelfMutation.isPending}
                />
            )}
        </div>
    );
};
