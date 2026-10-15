import type { ReactNode } from "react";

import { requirePageSession } from "@/lib/auth/session";

export default async function ExportLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageSession("/export", true);

  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
