import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type VisitorSession = {
  isAuthenticated: boolean;
  displayName: string | null;
  sub: string | null;
};

const anonymous: VisitorSession = {
  isAuthenticated: false,
  displayName: null,
  sub: null,
};

function isAuth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.APP_BASE_URL &&
      process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET,
  );
}

let client: Auth0Client | null = null;

function getAuth0Client(): Auth0Client | null {
  if (!isAuth0Configured()) {
    return null;
  }
  if (!client) {
    client = new Auth0Client();
  }
  return client;
}

export async function auth0Middleware(request: NextRequest) {
  const auth0 = getAuth0Client();
  if (!auth0) {
    return NextResponse.next();
  }
  return auth0.middleware(request);
}

export async function getVisitorSession(): Promise<VisitorSession> {
  const auth0 = getAuth0Client();
  if (!auth0) {
    return anonymous;
  }
  try {
    const session = await auth0.getSession();
    const user = session?.user;
    const sub = typeof user?.sub === "string" ? user.sub : null;
    if (!sub) {
      return anonymous;
    }
    const displayName =
      (typeof user?.nickname === "string" && user.nickname) ||
      (typeof user?.email === "string" && user.email) ||
      (typeof user?.name === "string" && user.name) ||
      "compte";
    return { isAuthenticated: true, displayName, sub };
  } catch {
    return anonymous;
  }
}
