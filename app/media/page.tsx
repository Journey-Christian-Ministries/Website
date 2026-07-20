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
      <div className="eyebrow">Media</div>
      <h1 className="page-title">Media Library</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <span className="placeholder-badge">Coming Soon</span>
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
