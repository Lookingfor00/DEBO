"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export type PushSubscribeViewProps = {
  hasKeywords: boolean;
};

export function PushSubscribeView({ hasKeywords }: PushSubscribeViewProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  if (!hasKeywords) {
    return null;
  }

  async function enableNotifications() {
    setStatus("loading");
    setMessage(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
      if (!publicKey) {
        throw new Error("vapid_public_missing");
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("push_unsupported");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("permission_denied");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            publicKey,
          ) as BufferSource,
        }));

      const json = subscription.toJSON();
      const endpoint = json.endpoint ?? "";
      const p256dh = json.keys?.p256dh ?? "";
      const auth = json.keys?.auth ?? "";
      if (!endpoint || !p256dh || !auth) {
        throw new Error("subscription_invalid");
      }

      const response = await fetch("/api/alerts/push-subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint,
          keys: { p256dh, auth },
        }),
      });
      if (!response.ok) {
        throw new Error(`subscribe_failed:${response.status}`);
      }

      setStatus("on");
      setMessage("Notifications activées pour vos mots-clés.");
    } catch {
      setStatus("error");
      setMessage(
        "Impossible d’activer les notifications. Vérifiez la permission du navigateur.",
      );
    }
  }

  return (
    <div className="mt-6 max-w-xl rounded-md border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Recevez une notification navigateur lorsqu’une nouvelle offre correspond
        à vos mots-clés.
      </p>
      <button
        type="button"
        className={buttonVariants({ className: "mt-3" })}
        disabled={status === "loading" || status === "on"}
        onClick={() => void enableNotifications()}
      >
        {status === "on"
          ? "Notifications activées"
          : status === "loading"
            ? "Activation…"
            : "Activer les notifications"}
      </button>
      {message ? (
        <p
          className={
            status === "error"
              ? "mt-2 text-sm text-destructive"
              : "mt-2 text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
