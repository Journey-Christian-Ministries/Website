import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media",
  description:
    "The Journey Christian Ministries online media library is coming soon — launching September 1, 2026.",
  openGraph: {
    title: "Media",
    description:
      "The Journey Christian Ministries online media library is coming soon — launching September 1, 2026.",
  },
};

export default function MediaPage() {
  return (
    <div className="page">
      <h1 className="page-title">Media Library</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <p className="lead" style={{ margin: 0 }}>
          We&rsquo;re preparing our online media library to provide an even
          better viewing experience.
        </p>
        <p className="lead" style={{ margin: "12px 0 0", fontWeight: 800 }}>
          Launching September 1, 2026.
        </p>
      </div>
    </div>
  );
}
