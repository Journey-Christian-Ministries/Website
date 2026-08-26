export type Category = "sunday" | "wednesday";

export type MediaItem = {
  id: string;
  category: Category;
  tag: string;
  title: string;
  videoId: string;
  date: string;
  latest: boolean;
};

const YOUTUBE_CHANNEL_ID = "UCImEO1CqmaOeNS6X_nWVEOw";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

// Used only if the YouTube feed can't be fetched or parsed, so the page
// never shows an empty or broken Media archive. Not a source of new
// content — just the last known-good list.
const FALLBACK_ITEMS: Omit<MediaItem, "latest">[] = [
  {
    id: "whats-in-your-hand",
    category: "sunday",
    tag: "Sunday Worship",
    title: "What’s In Your Hand?",
    videoId: "QeH_DpeZ7sI",
    date: "August 23, 2026",
  },
  {
    id: "wisdom-wednesdays-aug-19",
    category: "wednesday",
    tag: "Bible Study",
    title: "Wisdom Wednesdays",
    videoId: "7LojXPFyTac",
    date: "August 19, 2026",
  },
  {
    id: "elijah-vs-jezebel",
    category: "sunday",
    tag: "Sunday Worship",
    title: "Prophet Elijah vs. Queen Jezebel",
    videoId: "63psaklDifA",
    date: "August 16, 2026",
  },
  {
    id: "what-are-you-scared-of",
    category: "sunday",
    tag: "Sunday Worship",
    title: "What Are You Scared Of?",
    videoId: "SNVKwduOOek",
    date: "August 9, 2026",
  },
  {
    id: "wisdom-wednesdays-aug-5",
    category: "wednesday",
    tag: "Bible Study",
    title: "Wisdom Wednesdays",
    videoId: "5VxvbR7Hozo",
    date: "August 5, 2026",
  },
  {
    id: "wisdom-wednesdays-jul-29",
    category: "wednesday",
    tag: "Bible Study",
    title: "Wisdom Wednesdays — July 29",
    videoId: "NR5hypECplk",
    date: "July 29, 2026",
  },
];

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function categorize(title: string): { category: Category; tag: string } {
  if (/wisdom wednesdays/i.test(title)) {
    return { category: "wednesday", tag: "Bible Study" };
  }
  return { category: "sunday", tag: "Sunday Worship" };
}

function formatDate(published: string): string {
  const parsed = new Date(published);
  if (Number.isNaN(parsed.getTime())) return published;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

// Confirmed via YouTube's oEmbed endpoint (returns 401 Unauthorized) not to
// be publicly playable, even though it still appears in the channel's public
// RSS feed. Excluded so the archive doesn't surface a broken player.
const EXCLUDED_VIDEO_IDS = new Set(["LNgmOhf7Rh0"]);

type FeedEntry = { videoId: string; title: string; published: string };

// YouTube's channel RSS feed is a small, stable Atom document. A hand-rolled
// extractor avoids pulling in an XML parser dependency for a handful of
// well-known, always-present tags.
function parseFeed(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(xml))) {
    const block = match[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = block.match(/<title>([^<]*)<\/title>/)?.[1];
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
    if (videoId && title && published && !EXCLUDED_VIDEO_IDS.has(videoId)) {
      entries.push({ videoId, title: decodeEntities(title), published });
    }
  }
  return entries;
}

export async function getMediaItems(): Promise<MediaItem[]> {
  try {
    // Next.js Data Cache: served from cache for up to 3600s, then
    // revalidated on the next incoming request (no background polling).
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`YouTube feed responded with ${res.status}`);
    }
    const xml = await res.text();
    const entries = parseFeed(xml);
    if (entries.length === 0) {
      throw new Error("YouTube feed returned no parsable entries");
    }

    const sorted = [...entries].sort(
      (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
    );

    return sorted.map((entry, index) => {
      const { category, tag } = categorize(entry.title);
      return {
        id: entry.videoId,
        category,
        tag,
        title: entry.title,
        videoId: entry.videoId,
        date: formatDate(entry.published),
        latest: index === 0,
      };
    });
  } catch (err) {
    console.error("[media] Falling back to the last known video list:", err);
    return FALLBACK_ITEMS.map((item, index) => ({ ...item, latest: index === 0 }));
  }
}
