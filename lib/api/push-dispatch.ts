import "server-only";

import { listJobs } from "@/lib/api/jobs";
import {
  deletePushSubscriptionById,
  listPushSubscriptionsWithKeywords,
} from "@/lib/api/push-subscriptions";
import { hasPushSent, markPushSent } from "@/lib/api/push-sent";
import { isGoneStatus, sendJobAlert } from "@/lib/push/web-push";

export type PushDispatchResult = {
  scanned: number;
  sent: number;
  skipped: number;
  errors: number;
};

function siteOrigin(): string {
  const base =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  return base.replace(/\/$/, "") || "https://travail.solinet.dev";
}

export async function runPushDispatch(): Promise<PushDispatchResult> {
  const subscriptions = await listPushSubscriptionsWithKeywords();
  let scanned = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const origin = siteOrigin();

  for (const sub of subscriptions) {
    scanned += 1;
    const result = await listJobs({ q: sub.keywords, limit: 20 });
    for (const job of result.items) {
      if (await hasPushSent(sub.id, job.id)) {
        skipped += 1;
        continue;
      }

      const pushResult = await sendJobAlert({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        title: job.title?.trim() || "Nouvelle offre",
        url: `${origin}/jobs/${job.id}`,
        itemId: job.id,
      });

      if (!pushResult.ok) {
        errors += 1;
        if (isGoneStatus(pushResult.statusCode)) {
          await deletePushSubscriptionById(sub.id);
        }
        continue;
      }

      await markPushSent(sub.id, job.id);
      sent += 1;
    }
  }

  return { scanned, sent, skipped, errors };
}
