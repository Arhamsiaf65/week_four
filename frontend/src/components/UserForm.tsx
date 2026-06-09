import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

export type UserFormData = {
  name: string;
  email: string;
  password?: string;
  role: "viewer" | "editor" | "admin";
};

type Props = {
  mode: "create" | "edit";
  defaultValues?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export const UserForm: React.FC<Props> = ({ mode, defaultValues = {}, onSubmit, submitLabel, isSubmitting = false }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({ defaultValues: defaultValues as UserFormData });

  useEffect(() => {
    reset(defaultValues as UserFormData);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-100 uppercase tracking-wide mb-1.5" htmlFor="name">Full Name</label>
        <input id="name" {...register("name", { required: "Name is required", minLength: { value: 3, message: "Name must be at least 3 characters" } })} className="input-field" placeholder="Full Name" />
        {errors.name && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{errors.name.message}</span>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-100 uppercase tracking-wide mb-1.5" htmlFor="email">Email Address</label>
        <input id="email" {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" } })} className="input-field" placeholder="name@example.com" />
        {errors.email && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{errors.email.message}</span>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-100 uppercase tracking-wide mb-1.5" htmlFor="password">Temporary Password</label>
        <input id="password" type="password" {...register("password", mode === "create" ? { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } } : {})} className="input-field" placeholder="••••••••" />
        {errors.password && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{errors.password.message}</span>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-100 uppercase tracking-wide mb-1.5" htmlFor="role">Authorization Role</label>
        <select id="role" {...register("role", { required: "Role is required" })} className="input-field cursor-pointer">
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{errors.role.message}</span>}
      </div>

      <button type="submit" className="w-full btn-primary mt-6" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel ?? (mode === "create" ? "Create User" : "Update Details")}
      </button>
    </form>
  );
};

export default UserForm;
