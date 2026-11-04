import "server-only";

import webpush from "web-push";

export type WebPushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendJobAlertInput = {
  subscription: WebPushSubscriptionKeys;
  title: string;
  url: string;
  itemId: string;
};

let configured = false;

function ensureVapid(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.VAPID_SUBJECT?.trim() ?? "";
  if (!publicKey || !privateKey || !subject) {
    throw new Error("vapid_not_configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isGoneStatus(statusCode: number): boolean {
  return statusCode === 404 || statusCode === 410;
}

export async function sendJobAlert(
  input: SendJobAlertInput,
): Promise<{ ok: true } | { ok: false; statusCode: number; body: string }> {
  ensureVapid();
  const payload = JSON.stringify({
    title: input.title.slice(0, 120),
    url: input.url,
    item_id: input.itemId,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: input.subscription.endpoint,
        keys: {
          p256dh: input.subscription.p256dh,
          auth: input.subscription.auth,
        },
      },
      payload,
    );
    return { ok: true };
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error != null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;
    const body =
      typeof error === "object" &&
      error != null &&
      "body" in error &&
      typeof (error as { body: unknown }).body === "string"
        ? (error as { body: string }).body
        : error instanceof Error
          ? error.message
          : "push_failed";
    return { ok: false, statusCode, body };
  }
}
