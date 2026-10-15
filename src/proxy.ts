import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";

export function proxy(request: NextRequest) {
  const devStub = process.env.NODE_ENV !== "production" && !process.env.COGNITO_USER_POOL_ID?.trim();
  if (devStub || request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const login = new URL("/api/auth/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/", "/((?!api/auth|forbidden|_next/static|_next/image|templates/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
