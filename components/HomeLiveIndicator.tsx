"use client";

import { useEffect, useState } from "react";

type LiveStatus = {
  live: boolean;
  videoId?: string;
};

export default function HomeLiveIndicator() {
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkYouTubeLive() {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to check YouTube live status");

        const status = (await response.json()) as LiveStatus;
        if (!cancelled) {
          setLiveVideoId(status.live && status.videoId ? status.videoId : null);
        }
      } catch {
        if (!cancelled) setLiveVideoId(null);
      }
    }

    void checkYouTubeLive();
    const timer = window.setInterval(checkYouTubeLive, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!liveVideoId) return null;

  return (
    <aside className="live-strip home-live-strip" aria-label="Journey is live now">
      <div>
        <div className="live-pill">
          <span className="dot" aria-hidden="true" />
          Live Now
        </div>
        <h3>Journey is live—join the service.</h3>
        <p>Watch the active broadcast on Journey&apos;s YouTube channel.</p>
      </div>
      <div className="buttons">
        <a
          className="btn live-button"
          href={`https://www.youtube.com/watch?v=${liveVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch Live on YouTube
        </a>
      </div>
    </aside>
  );
}
