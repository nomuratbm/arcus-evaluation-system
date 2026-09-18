import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/session";

export default async function OfficerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(
      auth.error.status === "unauthenticated"
        ? "/api/auth/login"
        : "/?auth=forbidden",
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Officer
            </p>
            <p className="text-sm font-medium text-foreground">
              {auth.session.displayName}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/officer"
              className="rounded-md px-2 py-1 text-foreground hover:bg-accent"
            >
              Dashboard
            </Link>
            <Link
              href="/export"
              className="rounded-md px-2 py-1 text-foreground hover:bg-accent"
            >
              Data export
            </Link>
            <Link
              href="/"
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
