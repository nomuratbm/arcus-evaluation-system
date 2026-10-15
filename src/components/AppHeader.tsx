"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils/utils";
import type { AppSession } from "@/lib/auth/types";

type AppHeaderProps = {
  session: AppSession | null;
};

export function AppHeader({ session }: AppHeaderProps) {
  const pathname = usePathname();
  const subtitle = subtitleFor(pathname, session?.role ?? null);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto grid w-full max-w-5xl min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex sm:h-16 sm:px-6 sm:py-0">
        <Link href="/" className="min-w-0">
          <h1
            className="truncate text-base font-semibold text-foreground"
            title="Arcus Evaluation System"
          >
            AES
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </Link>
        <div className="order-last col-span-2 w-full min-w-0 sm:order-none sm:ml-auto sm:w-auto">
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            <HeaderNav pathname={pathname} session={session} />
          </div>
        </div>
        <Separator className="hidden h-6 sm:block" orientation="vertical" />
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t bg-muted/40">
        <div className="mx-auto w-full max-w-5xl px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
          Made by AWS-SBG: Arcus
        </div>
      </div>
    </header>
  );
}

function HeaderNav({
  pathname,
  session,
}: {
  pathname: string;
  session: AppSession | null;
}) {
  if (!session) {
    return (
      <Button
        className="max-sm:size-8 max-sm:px-0"
        render={<a href="/api/auth/login" />}
        size="sm"
        variant="outline"
      >
        <LogIn className="sm:hidden" />
        <span className="max-sm:hidden">Login</span>
      </Button>
    );
  }

  const accountName = visibleAccountName(session);

  return (
    <>
      {session.role === "admin" ? (
        <>
          <Link
            className={navLinkClass(pathname === "/officer" || pathname.startsWith("/officer/"))}
            href="/officer"
          >
            Dashboard
          </Link>
          <Link
            className={navLinkClass(pathname === "/export" || pathname.startsWith("/export/"))}
            href="/export"
          >
            Data export
          </Link>
        </>
      ) : null}
      {accountName ? (
        <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
          {accountName}
        </span>
      ) : null}
      <Button
        aria-label="Sign out"
        className="max-sm:size-8 max-sm:px-0"
        render={<a href="/api/auth/logout" />}
        size="sm"
        title="Sign out"
        variant="outline"
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

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-2 py-1 text-sm hover:bg-accent",
    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
  );
}

function subtitleFor(pathname: string, role: AppSession["role"] | null) {
  if (pathname.startsWith("/officer")) return "Officer dashboard";
  if (pathname.startsWith("/export")) return "Data export";
  if (pathname.startsWith("/forms/submitted")) return "Evaluation submitted";
  if (pathname.startsWith("/forms")) return "Evaluation form";
  if (pathname.startsWith("/forbidden")) return "Access denied";
  if (role === "admin") return "Officer";
  if (role === "student") return "Your event evaluations";
  return "Student activity evaluations";
}
