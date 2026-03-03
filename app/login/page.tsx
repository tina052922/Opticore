import { Suspense } from "react";
import LoginClient from "./login-client";

export default function LoginPage() {
  // useSearchParams is used in a client component; wrap with Suspense for Next.js prerendering.
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}

