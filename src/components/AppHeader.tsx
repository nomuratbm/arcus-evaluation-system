"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppSession } from "@/lib/auth/types";

type AppHeaderProps = {
  session: AppSession | null;
};

export function AppHeader({ session }: AppHeaderProps) {
  const pathname = usePathname();
  const subtitle = subtitleFor(pathname, session?.role ?? null);

  return (
    <header>
      <div className="bg-maroon text-white">
        <div className="mx-auto grid w-full max-w-5xl min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex sm:h-16 sm:px-6 sm:py-0">
          <Link href="/" className="min-w-0 text-white">
            <h1
              className="truncate text-base font-semibold text-white"
              title="Arcus Evaluation System"
            >
              AES
            </h1>
            <p className="truncate text-xs text-white/80">{subtitle}</p>
          </Link>
          <div className="order-last col-span-2 w-full min-w-0 sm:order-none sm:ml-auto sm:w-auto">
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
              <HeaderNav session={session} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-y bg-muted/40">
        <div className="mx-auto w-full max-w-5xl px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
          Made by AWS-SBG: Mapua University Makati
        </div>
      </div>
    </header>
  );
}

function HeaderNav({ session }: { session: AppSession | null }) {
  if (!session) {
    return (
      <Button
        className="max-sm:size-8 max-sm:px-0 border-maroon bg-maroon text-white shadow-xs/5 shadow-maroon/24 hover:border-maroon-hover hover:bg-maroon-hover hover:text-white focus-visible:ring-white focus-visible:ring-offset-maroon not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-maroon/40%)] [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-maroon/32%)]"
        render={<a href="/api/auth/login" />}
        size="sm"
        variant="default"
      >
        <LogIn className="sm:hidden" />
        <span className="max-sm:hidden">Login</span>
      </Button>
    );
  }

  const accountName = visibleAccountName(session);

  return (
    <>
      {accountName ? (
        <span className="hidden max-w-40 truncate text-xs text-white/80 sm:inline">
          {accountName}
        </span>
      ) : null}
      <Button
        aria-label="Sign out"
        className="max-sm:size-8 max-sm:px-0 border-maroon bg-maroon text-white shadow-xs/5 shadow-maroon/24 hover:border-maroon-hover hover:bg-maroon-hover hover:text-white focus-visible:ring-white focus-visible:ring-offset-maroon not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-maroon/40%)] [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-maroon/32%)]"
        render={<a href="/api/auth/logout" />}
        size="sm"
        title="Sign out"
        variant="default"
      >
        <LogOut className="sm:hidden" />
        <span className="max-sm:hidden">Sign out</span>
      </Button>
    </>
  );
}

function visibleAccountName(session: AppSession) {
  const name = session.displayName.trim();
  if (!name || name === session.userId || isUuid(name)) return null;
  return name;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function subtitleFor(pathname: string, role: AppSession["role"] | null) {
  if (pathname.startsWith("/officer")) return "Officer dashboard";
  if (pathname.startsWith("/forms/submitted")) return "Evaluation submitted";
  if (pathname.startsWith("/forms")) return "Evaluation form";
  if (pathname.startsWith("/forbidden")) return "Access denied";
  if (role === "admin") return "Officer";
  if (role === "student") return "Your event evaluations";
  return "Student activity evaluations";
}
