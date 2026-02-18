"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const schema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid CTU email required"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/register-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setServerError(data?.message ?? "Registration failed.");
        return;
      }
      setSuccess(true);
    } catch (e) {
      setServerError("Network error while registering.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="glass-panel flex w-full max-w-md flex-col gap-6 rounded-3xl px-8 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-brand-teal/90 flex items-center justify-center text-lg font-bold shadow-lg">
            STU
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Student Registration
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Create a student account to view your section schedule in OptiCore.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Full name
            </label>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="Juan Dela Cruz"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              CTU Email
            </label>
            <input
              type="email"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="student@ctu.edu.ph"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="Choose a password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Confirm password
            </label>
            <input
              type="password"
              className="h-9 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-xs outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="Re-type password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create student account"}
          </Button>
        </form>

        {serverError && (
          <p className="text-center text-[11px] text-red-400">{serverError}</p>
        )}
        {success && (
          <p className="text-center text-[11px] text-emerald-400">
            Account created. You can now sign in from the login page.
          </p>
        )}
        <div className="mt-2 text-center text-[11px] text-slate-400">
          <p>Already have an account?</p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

