import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Watch sermons and Bible studies from Journey Christian Ministries — coming soon.",
  openGraph: {
    title: "Sermons",
    description:
      "Watch sermons and Bible studies from Journey Christian Ministries — coming soon.",
  },
};

export default function SermonsPage() {
  return (
    <div className="page">
      <div className="eyebrow">Sermons</div>
      <h1 className="page-title">Sermons</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <span className="placeholder-badge">Coming Soon</span>
        <p className="lead" style={{ margin: 0 }}>
          {/* PLACEHOLDER: this page will contain embedded YouTube videos
              organized into two categories: "Sunday Services" and
              "Bible Studies". Do not invent content. */}
          This page is a temporary placeholder. Recorded messages will appear
          here soon, organized into <strong>Sunday Services</strong> and{" "}
          <strong>Bible Studies</strong>.
        </p>
      </div>
    </div>
  );
}
