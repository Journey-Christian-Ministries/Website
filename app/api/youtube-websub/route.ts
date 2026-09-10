import { revalidatePath, revalidateTag } from "next/cache";
import {
  MEDIA_CACHE_TAG,
  YOUTUBE_CHANNEL_ID,
  YOUTUBE_FEED_URL,
} from "@/lib/media";

export const runtime = "nodejs";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const topic = params.get("hub.topic");
  const challenge = params.get("hub.challenge");

  const validMode = mode === "subscribe" || mode === "unsubscribe";
  if (!validMode || topic !== YOUTUBE_FEED_URL || !challenge) {
    return new Response("Invalid WebSub verification request", { status: 400 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const notification = await request.text();
  const channelIds = Array.from(
    notification.matchAll(/<yt:channelId>\s*([^<]+?)\s*<\/yt:channelId>/g),
    (match) => match[1]
  );

  // The callback is public by design. Only a notification containing Journey's
  // exact channel ID can invalidate caches, and no notification content is
  // written to or rendered by the site.
  if (!channelIds.includes(YOUTUBE_CHANNEL_ID)) {
    return new Response("Notification was not for the Journey channel", {
      status: 400,
    });
  }

  revalidateTag(MEDIA_CACHE_TAG);
  revalidatePath("/media");

  return new Response(null, { status: 204 });
}
