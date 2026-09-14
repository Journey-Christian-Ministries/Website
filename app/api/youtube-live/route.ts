export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveStatus = {
  live?: unknown;
  videoId?: unknown;
};

const LIVE_STATUS_URL =
  "https://script.google.com/macros/s/AKfycbyZOhd1yfjh3Hs7VLdEIyci2DEW9HOmq-7AxtxwwMJdrINl7ob7byHL41867Fq4-fdV3Q/exec";

const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=15, stale-while-revalidate=15",
};

export async function GET() {
  try {
    const response = await fetch(LIVE_STATUS_URL, {
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
