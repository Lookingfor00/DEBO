import { NextResponse } from "next/server";

import {
  ActivationCodeError,
  activateWithCode,
} from "@/lib/api/activation-codes";
import {
  ALERTS_SESSION_COOKIE,
  alertsSessionCookieOptions,
  createAlertsSessionToken,
} from "@/lib/alerts/session";

function isFormPost(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return (
    type.includes("application/x-www-form-urlencoded") ||
    type.includes("multipart/form-data")
  );
}

function setSessionCookie(response: NextResponse, phoneActivationId: string) {
  const token = createAlertsSessionToken(phoneActivationId);
  response.cookies.set(
    ALERTS_SESSION_COOKIE,
    token,
    alertsSessionCookieOptions(),
  );
}

export async function POST(request: Request) {
  let msisdn = "";
  let code = "";
  const asForm = isFormPost(request);

  if (asForm) {
    const form = await request.formData();
    msisdn = String(form.get("msisdn") ?? "");
    code = String(form.get("code") ?? "");
  } else {
    const body = (await request.json()) as {
      msisdn?: unknown;
      code?: unknown;
    };
    msisdn = typeof body.msisdn === "string" ? body.msisdn : "";
    code = typeof body.code === "string" ? body.code : "";
  }

  try {
    const result = await activateWithCode(msisdn, code);
    if (asForm) {
      const response = NextResponse.redirect(
        new URL("/alerts", request.url),
        303,
      );
      setSessionCookie(response, result.phoneActivationId);
      return response;
    }
    const response = NextResponse.json({
      msisdn: result.msisdn,
      activated: true,
    });
    setSessionCookie(response, result.phoneActivationId);
    return response;
  } catch (error) {
    if (error instanceof ActivationCodeError) {
      if (asForm) {
        const url = new URL("/alerts", request.url);
        url.searchParams.set("activate_error", error.code);
        return NextResponse.redirect(url, 303);
      }
      const status =
        error.code === "code_not_found" ||
        error.code === "code_invalidated" ||
        error.code === "code_bound_to_other_msisdn"
          ? 403
          : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    throw error;
  }
}
