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

// Used only if the YouTube API is unavailable, so the page never shows an
// empty or broken Media archive. It is not the primary archive source.
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

type YouTubeApiResponse<T> = {
  items?: T[];
  nextPageToken?: string;
};

type PlaylistItem = {
  snippet?: { resourceId?: { videoId?: string } };
};

type Video = {
  id?: string;
  snippet?: { title?: string; publishedAt?: string };
  status?: { privacyStatus?: string };
};

async function fetchYouTubeApi<T>(
  resource: string,
  params: Record<string, string>
): Promise<YouTubeApiResponse<T>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const query = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/${resource}?${query.toString()}`,
    { next: { revalidate: 3600, tags: [MEDIA_CACHE_TAG] } }
  );
  if (!response.ok) {
    throw new Error(`YouTube Data API ${resource} responded with ${response.status}`);
  }
  return (await response.json()) as YouTubeApiResponse<T>;
}

async function getUploadsPlaylistId(): Promise<string> {
  const response = await fetchYouTubeApi<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>(
    "channels",
    { part: "contentDetails", id: YOUTUBE_CHANNEL_ID }
  );
  const uploadsPlaylistId = response.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("YouTube uploads playlist was not found");
  return uploadsPlaylistId;
}

async function getAllUploadVideoIds(playlistId: string): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetchYouTubeApi<PlaylistItem>("playlistItems", {
      part: "snippet",
      maxResults: "50",
      playlistId,
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of response.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId && !EXCLUDED_VIDEO_IDS.has(videoId)) videoIds.push(videoId);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  return videoIds;
}

async function getVideos(videoIds: string[]): Promise<Video[]> {
  const videos: Video[] = [];
  for (let index = 0; index < videoIds.length; index += 50) {
    const response = await fetchYouTubeApi<Video>("videos", {
      part: "snippet,status",
      id: videoIds.slice(index, index + 50).join(","),
    });
    videos.push(...(response.items ?? []));
  }
  return videos;
}

async function getYouTubeArchive(): Promise<MediaItem[]> {
  const playlistId = await getUploadsPlaylistId();
  const videos = await getVideos(await getAllUploadVideoIds(playlistId));
  const publicVideos = videos.filter(
    (video): video is Video & { id: string; snippet: { title: string; publishedAt: string } } =>
      Boolean(
        video.id &&
          video.snippet?.title &&
          video.snippet.publishedAt &&
          video.status?.privacyStatus === "public"
      )
  );
  const sorted = publicVideos.sort(
    (a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
  );

  return sorted.map((video, index) => {
    const { category, tag } = categorize(video.snippet.title);
    return {
      id: video.id,
      category,
      tag,
      title: video.snippet.title,
      videoId: video.id,
      date: formatDate(video.snippet.publishedAt),
      latest: index === 0,
    };
  });
}

export async function getMediaItems(): Promise<MediaItem[]> {
  try {
    return await getYouTubeArchive();
  } catch (err) {
    console.error("[media] Falling back to the last known video list:", err);
    return FALLBACK_ITEMS.map((item, index) => ({ ...item, latest: index === 0 }));
  }
}
