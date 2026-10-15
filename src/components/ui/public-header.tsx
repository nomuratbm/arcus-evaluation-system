import { AppHeader } from "@/components/AppHeader";
import { getSession } from "@/lib/auth/session";

/** Shared header for every page. Matches the attendance system bar. */
export async function PublicHeader() {
  const session = await getSession();
  return <AppHeader session={session} />;
}
