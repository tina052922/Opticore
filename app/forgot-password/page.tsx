"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Valid email required")
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setResetUrl(null);
    setSent(false);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email })
      });
      const data = await res.json();
      setSent(true);
      if (data.resetUrl) setResetUrl(data.resetUrl);
      if (!res.ok) setError(data.message ?? "Request failed.");
    } catch {
      setError("Network error.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="glass-panel flex w-full max-w-md flex-col gap-6 rounded-3xl px-8 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-lg font-bold text-amber-400">
            ?
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Forgot password
          </h1>
          <p className="text-center text-xs text-slate-300">
            Enter your CTU email and we&apos;ll send a reset link (in production, via email).
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                className="h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm outline-none placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
                placeholder="you@ctu.edu.ph"
                {...register("email")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-emerald-400">
              If an account exists with that email, a reset link was generated.
            </p>
            {resetUrl && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs">
                <p className="mb-2 text-slate-400">Demo: use this link to reset:</p>
                <a
                  href={resetUrl}
                  className="break-all text-brand-teal hover:underline"
                >
                  {resetUrl}
                </a>
              </div>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        )}

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        <p className="text-center text-[11px] text-slate-400">
          <Link href="/login" className="text-brand-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
