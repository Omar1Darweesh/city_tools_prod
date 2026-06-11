import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handler = createMiddleware(routing);

const proxyPaths = ["/backoffice", "/pos-client", "/backend"];

function matchesProxyPath(pathname: string): boolean {
  // Strip locale prefix if present (e.g. /ar/backoffice -> /backoffice)
  let normalized = pathname;
  for (const locale of routing.locales) {
    const prefix = "/" + locale;
    if (pathname === prefix) break; // just the locale, not our path
    if (pathname.startsWith(prefix + "/")) {
      normalized = pathname.slice(prefix.length);
      break;
    }
  }

  for (const p of proxyPaths) {
    if (normalized === p || normalized.startsWith(p + "/")) {
      return true;
    }
  }
  return false;
}

export function proxy(request: NextRequest) {
  if (matchesProxyPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return handler(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
