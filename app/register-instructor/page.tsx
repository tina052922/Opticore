"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    email: z
      .string()
      .email("Valid CTU email required")
      .refine((e) => e.endsWith("@ctu.edu.ph"), "Use @ctu.edu.ph email"),
    password: z.string().min(4, "At least 4 characters"),
    confirmPassword: z.string(),
    collegeId: z.string().optional(),
    programId: z.string().optional()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits only")
});

type RegisterValues = z.infer<typeof registerSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export default function RegisterInstructorPage() {
  const [step, setStep] = useState<"register" | "otp">("register");
  const [serverError, setServerError] = useState<string | null>(null);
  const [displayOtp, setDisplayOtp] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema)
  });

  const onRegister = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/register-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.message ?? "Registration failed.");
        return;
      }
      setRegisteredEmail(values.email.trim().toLowerCase());
      setDisplayOtp(data.otp ?? null);
      setStep("otp");
      otpForm.reset({ otp: "" });
    } catch {
      setServerError("Network error.");
    }
  };

  const onVerifyOtp = async (values: OtpValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredEmail,
          otp: values.otp.replace(/\D/g, "")
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.message ?? "Verification failed.");
        return;
      }
      setStep("register");
      setDisplayOtp(null);
      window.location.href = "/login?verified=1&changePassword=1";
    } catch {
      setServerError("Network error.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="glass-panel flex w-full max-w-md flex-col gap-6 rounded-3xl px-8 py-10">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Instructor Registration</h1>
          <p className="mt-1 text-xs text-slate-400">CTU–Argao faculty onboarding</p>
        </div>

        {serverError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {serverError}
          </div>
        )}

        {step === "register" && (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4 text-sm">
            <div>
              <label className="text-xs text-slate-300">Full name</label>
              <input
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm"
                {...registerForm.register("name")}
              />
              {registerForm.formState.errors.name && (
                <p className="text-xs text-red-400">{registerForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-300">CTU email</label>
              <input
                type="email"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm"
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-300">Temporary password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm"
                {...registerForm.register("password")}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Confirm password</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm"
                {...registerForm.register("confirmPassword")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
              Register
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            {displayOtp && (
              <div className="rounded-xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Your OTP</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-brand-teal">
                  {displayOtp}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Valid 30 minutes. No email will be sent.
                </p>
              </div>
            )}
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-3">
              <label className="text-xs text-slate-300">Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                className="h-12 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-center font-mono text-lg tracking-[0.4em]"
                {...otpForm.register("otp")}
              />
              {otpForm.formState.errors.otp && (
                <p className="text-xs text-red-400">{otpForm.formState.errors.otp.message}</p>
              )}
              <Button type="submit" className="w-full">
                Verify OTP
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400">
          <Link href="/login" className="text-brand-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
