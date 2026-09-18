import Link from "next/link";
import { LogIn, LayoutDashboard, LogOut } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

/**
 * Shared header for public pages.
 * Shows the app title, and a Login button (or admin links when authenticated).
 */
export async function PublicHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
        >
          Arcus Evaluation System
        </Link>

        <nav className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {session.displayName}
              </span>
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/officer" />}
              >
                <LayoutDashboard />
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                render={<a href="/api/auth/logout" />}
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              render={<a href="/api/auth/login" />}
            >
              <LogIn />
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
