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

export const YOUTUBE_CHANNEL_ID = "UCImEO1CqmaOeNS6X_nWVEOw";
export const YOUTUBE_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
export const YOUTUBE_HUB_URL = "https://pubsubhubbub.appspot.com/subscribe";
export const MEDIA_CACHE_TAG = "youtube-media";
export const YOUTUBE_LIVE_STATUS_URL =
  "https://script.google.com/macros/s/AKfycbyZOhd1yfjh3Hs7VLdEIyci2DEW9HOmq-7AxtxwwMJdrINl7ob7byHL41867Fq4-fdV3Q/exec";
export const YOUTUBE_ARCHIVE_URL = `${YOUTUBE_LIVE_STATUS_URL}?view=archive`;

// Keep the older known-good archive entries in the site so a fresh deployment
// cannot make them disappear when YouTube's RSS feed only returns recent items.
const KNOWN_ARCHIVE_ITEMS: Omit<MediaItem, "latest">[] = [
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

const EXCLUDED_VIDEO_IDS = new Set(["LNgmOhf7Rh0"]);

type FeedEntry = { videoId: string; title: string; published: string };
type ArchiveEntry = {
  videoId: string;
  title: string;
  publishedAt: string;
};

type ArchiveResponse = {
  videos?: unknown;
};

function parseArchive(payload: ArchiveResponse): ArchiveEntry[] {
  if (!Array.isArray(payload.videos)) return [];

  return payload.videos.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const candidate = item as Record<string, unknown>;
    const videoId = candidate.videoId;
    const title = candidate.title;
    const publishedAt = candidate.publishedAt;

    if (
      typeof videoId !== "string" ||
      !/^[A-Za-z0-9_-]{11}$/.test(videoId) ||
      EXCLUDED_VIDEO_IDS.has(videoId) ||
      typeof title !== "string" ||
      typeof publishedAt !== "string" ||
      Number.isNaN(new Date(publishedAt).getTime())
    ) {
      return [];
    }

    return [{ videoId, title, publishedAt }];
  });
}

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

function knownArchiveWithLatest(): MediaItem[] {
  return KNOWN_ARCHIVE_ITEMS.map((item, index) => ({
    ...item,
    latest: index === 0,
  }));
}

export async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const response = await fetch(YOUTUBE_ARCHIVE_URL, {
      redirect: "follow",
      next: { revalidate: 3600, tags: [MEDIA_CACHE_TAG] },
    });

    if (!response.ok) {
      throw new Error(`Journey archive responded with ${response.status}`);
    }

    const entries = parseArchive((await response.json()) as ArchiveResponse);
    if (entries.length === 0) {
      throw new Error("Journey archive returned no valid videos");
    }

    return entries.map((entry, index) => {
      const { category, tag } = categorize(entry.title);
      return {
        id: entry.videoId,
        category,
        tag,
        title: entry.title,
        videoId: entry.videoId,
        date: formatDate(entry.publishedAt),
        latest: index === 0,
      };
    });
  } catch (archiveError) {
    console.error(
      "[media] Apps Script archive unavailable; using RSS:",
      archiveError
    );
  }

  try {
    const response = await fetch(YOUTUBE_FEED_URL, {
      next: { revalidate: 3600, tags: [MEDIA_CACHE_TAG] },
    });

    if (!response.ok) {
      throw new Error(`YouTube feed responded with ${response.status}`);
    }

    const entries = parseFeed(await response.text());
    if (entries.length === 0) {
      throw new Error("YouTube feed returned no parsable entries");
    }

    const merged = new Map<string, Omit<MediaItem, "latest">>();

    for (const item of KNOWN_ARCHIVE_ITEMS) {
      merged.set(item.videoId, item);
    }

    for (const entry of entries) {
      const { category, tag } = categorize(entry.title);
      merged.set(entry.videoId, {
        id: entry.videoId,
        category,
        tag,
        title: entry.title,
        videoId: entry.videoId,
        date: formatDate(entry.published),
      });
    }

    const sorted = Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sorted.map((item, index) => ({ ...item, latest: index === 0 }));
  } catch (feedError) {
    console.error("[media] Falling back to the known archive list:", feedError);
    return knownArchiveWithLatest();
  }
}
