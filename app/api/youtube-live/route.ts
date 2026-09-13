import { YOUTUBE_CHANNEL_ID } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type YouTubePlayerResponse = {
  videoDetails?: {
    videoId?: string;
    channelId?: string;
    isLive?: boolean;
    isLiveContent?: boolean;
    isUpcoming?: boolean;
  };
};

const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=15, stale-while-revalidate=15",
};

function extractPlayerResponse(page: string): YouTubePlayerResponse | null {
  const markerIndex = page.indexOf("ytInitialPlayerResponse");
  if (markerIndex === -1) return null;

  const start = page.indexOf("{", markerIndex);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < page.length; index += 1) {
    const character = page[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(page.slice(start, index + 1)) as YouTubePlayerResponse;
      }
    }
  }

  return null;
}

async function getNewestVideoId() {
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`YouTube feed responded with ${response.status}`);
  }

  const feed = await response.text();
  return feed.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? null;
}

export async function GET() {
  try {
    const videoId = await getNewestVideoId();
    if (!videoId) {
      return Response.json({ live: false }, { headers: RESPONSE_HEADERS });
    }

    const response = await fetch(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      {
        cache: "no-store",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; JourneyChristianMinistries/1.0)",
        },
      }
    );

    if (!response.ok) throw new Error(`YouTube responded with ${response.status}`);

    const player = extractPlayerResponse(await response.text());
    const details = player?.videoDetails;
    const live = Boolean(
      details?.videoId === videoId &&
        details.channelId === YOUTUBE_CHANNEL_ID &&
        (details.isLive || details.isLiveContent) &&
        !details.isUpcoming
    );

    return Response.json(
      live ? { live: true, videoId } : { live: false },
      { headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error("[youtube-live] Live status check failed:", error);
    return Response.json(
      { live: false },
      { status: 200, headers: RESPONSE_HEADERS }
    );
  }
}
