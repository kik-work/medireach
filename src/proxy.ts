import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * The admin stats API (/api/admin) is reachable from localhost only.
 * The /admin pages are protected by their own login instead.
 */
export function proxy(req: NextRequest) {
  const hostname = req.headers.get("host")?.replace(/:\d+$/, "") ?? "";
  if (!LOCAL_HOSTS.has(hostname)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
