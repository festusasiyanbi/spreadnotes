import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const appHosts = new Set(["app.spreadnotes.app", "staging.spreadnotes.app"]);
const localStaging = "http://staging.localhost:3000";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const path = request.nextUrl.pathname;
  if (host === "app.localhost") {
    return NextResponse.redirect(new URL(path === "/workspace" || path === "/demo" ? "/" : `${path}${request.nextUrl.search}`, localStaging), 307);
  }
  if (host === "localhost" && (path === "/workspace" || path === "/demo")) {
    return NextResponse.redirect(new URL("/", localStaging), 307);
  }
  if (host === "localhost" && path === "/sign-in") {
    return NextResponse.redirect(new URL("/sign-in", localStaging), 307);
  }
  if (host === "staging.localhost" && path === "/demo") {
    return NextResponse.redirect(new URL("/", localStaging), 307);
  }
  if (path === "/demo") {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_STAGING_ORIGIN || "https://staging.spreadnotes.app"), 308);
  }
  if ((appHosts.has(host) || host === "staging.localhost") && path === "/") {
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
