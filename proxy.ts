import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const appHosts = new Set(["app.spreadnotes.app", "staging.spreadnotes.app"]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const path = request.nextUrl.pathname;
  if (path === "/demo") {
    return NextResponse.redirect(host === "localhost" ? new URL("/workspace", request.url) : new URL("/", process.env.NEXT_PUBLIC_STAGING_ORIGIN || "https://staging.spreadnotes.app"), 308);
  }
  if (appHosts.has(host) && path === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/workspace";
    const forwarded = new Headers(request.headers);
    forwarded.set("x-spreadnotes-host", host);
    return NextResponse.rewrite(destination, { request: { headers: forwarded } });
  }
  if ((host === "spreadnotes.app" || host === "www.spreadnotes.app") && path === "/sign-in") {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.spreadnotes.app"), 307);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|.*\\..*).*)"] };
