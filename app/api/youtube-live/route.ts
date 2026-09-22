import { YOUTUBE_LIVE_STATUS_URL } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveStatus = {
  live?: unknown;
  videoId?: unknown;
  title?: unknown;
  upcoming?: unknown;
};

type PublicBroadcast = {
  videoId: string;
  title: string;
  scheduledStartTime: string;
};

const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=15, stale-while-revalidate=15",
};

function parseBroadcast(value: unknown): PublicBroadcast | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.videoId !== "string" ||
    !/^[A-Za-z0-9_-]{11}$/.test(candidate.videoId) ||
    typeof candidate.title !== "string" ||
    typeof candidate.scheduledStartTime !== "string" ||
    Number.isNaN(new Date(candidate.scheduledStartTime).getTime())
  ) {
    return null;
  }

  return {
    videoId: candidate.videoId,
    title: candidate.title,
    scheduledStartTime: candidate.scheduledStartTime,
  };
}

export async function GET() {
  try {
    const response = await fetch(YOUTUBE_LIVE_STATUS_URL, {
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Google live status responded with ${response.status}`);
    }

    const status = (await response.json()) as LiveStatus;
    const videoId =
      typeof status.videoId === "string" &&
      /^[A-Za-z0-9_-]{11}$/.test(status.videoId)
        ? status.videoId
        : null;
    const live = status.live === true && Boolean(videoId);
    const upcoming = parseBroadcast(status.upcoming);

    return Response.json(
      live
        ? {
            live: true,
            videoId,
            title: typeof status.title === "string" ? status.title : null,
            upcoming,
          }
        : { live: false, upcoming },
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
