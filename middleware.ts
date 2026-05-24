import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { applySecurityHeaders } from "@/lib/security/headers";
import { ipRateLimit } from "@/lib/security/rate-limit";
import {
  isMaintenanceExemptPath,
  maintenanceModeJsonResponse,
} from "@/lib/maintenance-paths";

const { auth } = NextAuth(authConfig);

async function isMaintenanceModeActive(req: Request): Promise<boolean> {
  try {
    const url = new URL("/api/system/maintenance", req.url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { maintenanceMode?: boolean };
    return Boolean(data.maintenanceMode);
  } catch {
    return false;
  }
}

function isSuperAdminMfaExemptPath(pathname: string) {
  return (
    pathname === "/super-admin/mfa" ||
    pathname.startsWith("/super-admin/security") ||
    pathname.startsWith("/api/admin/mfa")
  );
}

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy",
  "/terms",
  "/security",
  "/under-maintenance",
  "/account-suspended",
  "/invite",
  "/api/auth",
  "/api/contact",
  "/api/register",
  "/api/stripe/webhook",
];

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

function withSecurityHeaders(response: NextResponse) {
  applySecurityHeaders(response.headers);
  return response;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!isMaintenanceExemptPath(pathname)) {
    const maintenanceActive = await isMaintenanceModeActive(req);
    if (maintenanceActive && !req.auth?.user?.isSuperAdmin) {
      if (pathname.startsWith("/api/")) {
        return withSecurityHeaders(maintenanceModeJsonResponse());
      }
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/under-maintenance", req.url))
      );
    }
  }

  if (req.method === "POST") {
    if (
      pathname.includes("/api/auth/callback/credentials") ||
      pathname.endsWith("/api/auth/signin/credentials")
    ) {
      const limited = await ipRateLimit(req, "credentials-login", 15, 15 * 60 * 1000);
      if (limited) return withSecurityHeaders(limited);
    }

    if (pathname === "/api/register") {
      const limited = await ipRateLimit(req, "register", 10, 60 * 60 * 1000);
      if (limited) return withSecurityHeaders(limited);
    }

    if (pathname === "/api/contact") {
      const limited = await ipRateLimit(req, "contact", 8, 60 * 60 * 1000);
      if (limited) return withSecurityHeaders(limited);
    }
  }

  const isLoggedIn = !!req.auth;
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.includes(pathname);
  const isSuperAdminRoute =
    pathname.startsWith("/super-admin") || pathname.startsWith("/maintenance");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/rentals") ||
    pathname.startsWith("/workforce") ||
    pathname.startsWith("/scheduling") ||
    pathname.startsWith("/logistics") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/automations") ||
    pathname.startsWith("/settings");

  if (isAuthRoute && isLoggedIn) {
    if (pathname === "/login") {
      const maintenanceActive = await isMaintenanceModeActive(req);

      if (maintenanceActive) {
        if (req.auth?.user?.isSuperAdmin) {
          return withSecurityHeaders(
            NextResponse.redirect(new URL("/super-admin", req.url))
          );
        }
        // Keep the login page available so admins can sign out and back in.
        return withSecurityHeaders(
          NextResponse.next({
            request: { headers: requestHeaders },
          })
        );
      }

      if (req.auth?.user?.isSuperAdmin) {
        return withSecurityHeaders(
          NextResponse.redirect(new URL("/super-admin", req.url))
        );
      }

      if (req.auth?.user?.organizationId) {
        return withSecurityHeaders(
          NextResponse.redirect(new URL("/dashboard", req.url))
        );
      }

      return withSecurityHeaders(
        NextResponse.redirect(new URL("/onboarding", req.url))
      );
    }

    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  if (isSuperAdminRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isSuperAdminRoute && isLoggedIn && !req.auth?.user?.isSuperAdmin) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  if (
    isLoggedIn &&
    req.auth?.user?.isSuperAdmin &&
    req.auth.user.totpEnabled &&
    !req.auth.user.superAdminMfaVerified &&
    !isSuperAdminMfaExemptPath(pathname) &&
    (isSuperAdminRoute || isAdminApiRoute)
  ) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "MFA verification required", code: "MFA_REQUIRED" },
          { status: 403 }
        )
      );
    }
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/super-admin/mfa", req.url))
    );
  }

  if (isAdminApiRoute && isLoggedIn && !req.auth?.user?.isSuperAdmin) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Forbidden" }, { status: 403 })
    );
  }

  if (isAdminApiRoute && !isLoggedIn) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  if (isAppRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (!isPublic && !isAppRoute && !isSuperAdminRoute && !isLoggedIn && pathname.startsWith("/api/")) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  return withSecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    })
  );
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

