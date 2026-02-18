"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Props = {
  email: string;
  roleLabel?: string;
};

export function UserBar({ email, roleLabel }: Props) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-slate-200">
      <div className="hidden flex-col text-right sm:flex">
        <span className="font-semibold">{email}</span>
        {roleLabel && (
          <span className="text-[10px] text-slate-400">
            Signed in as {roleLabel}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-[11px]"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Log out
      </Button>
    </div>
  );
}

