"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const schema = z
  .object({
    password: z.string().min(4, "At least 4 characters"),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  if (!token) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-amber-400">Invalid or missing reset token. Request a new link.</p>
        <Button asChild>
          <Link href="/forgot-password">Request reset link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Reset failed.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error.");
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-emerald-400">Password updated. You can sign in now.</p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">New password</label>
        <input
          type="password"
          className="h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm outline-none focus-visible:border-brand-teal focus-visible:ring-2"
          placeholder="••••••••"
          {...register("password")}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-200">Confirm password</label>
        <input
          type="password"
          className="h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm outline-none focus-visible:border-brand-teal focus-visible:ring-2"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="glass-panel flex w-full max-w-md flex-col gap-6 rounded-3xl px-8 py-10">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-center text-xs text-slate-300">
            Enter your new password below.
          </p>
        </div>
        <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-[11px] text-slate-400">
          <Link href="/login" className="text-brand-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
