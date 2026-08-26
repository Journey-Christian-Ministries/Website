import type { Metadata } from "next";
import MediaArchive from "@/components/MediaArchive";
import { getMediaItems } from "@/lib/media";

export const metadata: Metadata = {
  title: "Media",
  description:
    "Watch Journey Christian Ministries' Sunday Worship messages and Wisdom Wednesdays Bible studies, and find out how to watch live.",
  openGraph: {
    title: "Media",
    description:
      "Watch Journey Christian Ministries' Sunday Worship messages and Wisdom Wednesdays Bible studies, and find out how to watch live.",
  },
};

export default async function MediaPage() {
  const items = await getMediaItems();

  return (
    <div className="page media-page">
      <div className="page-head media-head">
        <div>
          <p className="eyebrow">Messages • Bible Study • Live</p>
          <h1 className="page-title">Media</h1>
          <p className="lead" style={{ marginTop: 10 }}>
            Worship, learn, and stay connected wherever you are through
            messages and broadcasts from Journey Christian Ministries.
          </p>
        </div>
        <div className="media-edition" aria-label="JCM Media Archive">
          <span className="jcm">JCM</span>
          <span className="archive">
            MEDIA
            <br />
            ARCHIVE
          </span>
        </div>
      </div>

      <MediaArchive items={items} />
    </div>
  );
}
