import { siteConfig } from "@/lib/site";
import { YOUTUBE_FEED_URL, YOUTUBE_HUB_URL } from "@/lib/media";

export const YOUTUBE_WEBSUB_CALLBACK_URL = `${siteConfig.url}/api/youtube-websub`;

export async function subscribeToYouTubeWebSub(): Promise<void> {
  const body = new URLSearchParams({
    "hub.callback": YOUTUBE_WEBSUB_CALLBACK_URL,
    "hub.mode": "subscribe",
    "hub.topic": YOUTUBE_FEED_URL,
    "hub.verify": "async",
    // The hub chooses the final lease length. Daily renewal keeps the
    // subscription active without polling YouTube for videos.
    "hub.lease_seconds": String(10 * 24 * 60 * 60),
  });

  const response = await fetch(YOUTUBE_HUB_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`YouTube WebSub hub responded with ${response.status}`);
  }
}
