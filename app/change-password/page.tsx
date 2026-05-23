"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(4, "At least 4 characters"),
    confirmPassword: z.string()
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Failed to update password.");
        return;
      }
      setDone(true);
      await signOut({ callbackUrl: "/login?passwordChanged=1" });
    } catch {
      setError("Network error.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md rounded-3xl px-8 py-10">
        <h1 className="text-xl font-semibold">Set your password</h1>
        <p className="mt-1 text-xs text-slate-400">
          First login requires a new password. You will sign in again with it.
        </p>
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
        {done ? (
          <p className="mt-4 text-sm text-emerald-300">Redirecting to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 text-sm">
            <div>
              <label className="text-xs text-slate-300">Current (temporary) password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-300">New password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3"
                {...register("newPassword")}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Confirm new password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
