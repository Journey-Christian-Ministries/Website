import { subscribeToYouTubeWebSub } from "@/lib/youtube-websub";

export const runtime = "nodejs";

const DAILY_SCHEDULE = "0 6 * * *";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const validSecret =
    Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`;

  // Vercel sends the schedule header on cron invocations. CRON_SECRET is used
  // when configured; the header provides a no-setup fallback because this
  // endpoint can only renew a public subscription for this fixed channel.
  const validVercelCron =
    process.env.VERCEL_ENV === "production" &&
    request.headers.get("x-vercel-cron-schedule") === DAILY_SCHEDULE;

  if (!validSecret && !validVercelCron) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await subscribeToYouTubeWebSub();
    return Response.json({ subscribed: true });
  } catch (error) {
    console.error("[youtube-websub] Subscription renewal failed:", error);
    return Response.json({ subscribed: false }, { status: 502 });
  }
}
