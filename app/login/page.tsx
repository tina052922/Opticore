"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        ...values,
        callbackUrl,
        redirect: false
      });
      if (result?.ok && result?.url) {
        router.push(result.url);
        router.refresh();
        return;
      }
      if (result?.error) {
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="glass-panel flex w-full max-w-md flex-col gap-6 rounded-3xl px-8 py-10">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-brand flex items-center justify-center text-lg font-bold shadow-lg">
            CTU
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to OptiCore
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Role-aware access for CTU–Argao campus stakeholders.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-200">
              CTU Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="you@ctu.edu.ph"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-white/10 bg-slate-900/60 px-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-[11px]">
            <Link href="/forgot-password" className="text-brand-teal hover:underline">
              Forgot password?
            </Link>
          </p>
        </form>
        <div className="space-y-1 text-center text-[11px] text-slate-400">
          <p>
            This is a capstone demo. Authentication is backed by NextAuth and
            Prisma with role-based sessions for CTU–Argao roles.
          </p>
          <p className="mt-2">
            New student?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-teal hover:underline"
            >
              Register
            </Link>
            .{" "}
            <Link
              href="/room-locator"
              className="font-semibold text-brand-teal hover:underline"
            >
              Room Locator
            </Link>{" "}
            (public)
          </p>
        </div>
      </div>
    </div>
  );
}

