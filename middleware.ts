import type { NextRequest } from "next/server";

import { auth0Middleware } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  return auth0Middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
