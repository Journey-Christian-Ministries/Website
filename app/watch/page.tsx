import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch Live",
  description:
    "Watch Journey Christian Ministries live services online — Sunday Worship and Wednesday Bible Study.",
  openGraph: {
    title: "Watch Live",
    description:
      "Watch Journey Christian Ministries live services online — Sunday Worship and Wednesday Bible Study.",
  },
};

/*
  PLACEHOLDER: replace with real YouTube Live channel/URL when provided.
  The church's YouTube account is not yet created. YouTube is the primary
  on-site viewing platform; Facebook is used for outreach only.
  Example real embed: https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
*/
const YOUTUBE_LIVE_EMBED_URL =
  "https://www.youtube.com/embed/live_stream?channel=PLACEHOLDER_CHANNEL_ID";

export default function WatchPage() {
  return (
    <div className="page">
      <div className="eyebrow">Live Online</div>
      <h1 className="page-title">Watch Journey Live</h1>
      <p className="lead">
        Join us online for Sunday Worship at 10:00 AM and Wednesday Bible Study
        at 7:00 PM (Eastern). The live player below streams our services as they
        happen.
      </p>

      <div className="video-frame">
        <iframe
          src={YOUTUBE_LIVE_EMBED_URL}
          title="Journey Christian Ministries YouTube Live stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <p className="lead" style={{ marginTop: 24 }}>
        {/* PLACEHOLDER: replace with real YouTube Live channel/URL when provided. */}
        When a service is not streaming, this page will show our most recent
        broadcast once our YouTube channel is live.
      </p>
    </div>
  );
}
