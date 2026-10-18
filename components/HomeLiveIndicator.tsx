"use client";

import { useState } from "react";

export default function HomeLiveIndicator() {
  // Preview branch only: force the live state so placement can be reviewed.
  const [liveVideoId] = useState("preview");

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
          href="https://www.youtube.com/@JourneyChristianMinistries/live"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch Live on YouTube
        </a>
      </div>
    </aside>
  );
}
