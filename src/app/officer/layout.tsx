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

  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
