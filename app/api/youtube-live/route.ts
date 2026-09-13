import { YOUTUBE_CHANNEL_ID } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type YouTubePlayerResponse = {
  videoDetails?: {
    videoId?: string;
    isLive?: boolean;
    isUpcoming?: boolean;
  };
};

export async function GET() {
  try {
    const response = await fetch(
      `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live`,
      {
        cache: "no-store",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; JourneyChristianMinistries/1.0)",
        },
      }
    );

    if (!response.ok) throw new Error(`YouTube responded with ${response.status}`);

    const page = await response.text();
    const match = page.match(
      /var ytInitialPlayerResponse = (\{[\s\S]+?\});<\/script>/
    );

    if (!match) return Response.json({ live: false });

    const player = JSON.parse(match[1]) as YouTubePlayerResponse;
    const details = player.videoDetails;
    const live = Boolean(
      details?.videoId && details.isLive && !details.isUpcoming
    );

    return Response.json(
      live ? { live: true, videoId: details?.videoId } : { live: false },
      {
        headers: {
          "cache-control": "public, s-maxage=20, stale-while-revalidate=40",
        },
      }
    );
  } catch (error) {
    console.error("[youtube-live] Live status check failed:", error);
    return Response.json({ live: false }, { status: 200 });
  }
}
