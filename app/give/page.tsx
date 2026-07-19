import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Support the ministry of Journey Christian Ministries — online giving options coming soon.",
  openGraph: {
    title: "Give",
    description:
      "Support the ministry of Journey Christian Ministries — online giving options coming soon.",
  },
};

export default function GivePage() {
  return (
    <div className="page">
      <div className="eyebrow">Give</div>
      <h1 className="page-title">Give</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <span className="placeholder-badge">Coming Soon</span>
        <p className="lead" style={{ margin: 0 }}>
          {/* PLACEHOLDER: real giving methods and instructions will be added
              when provided by the church. Do not invent content. */}
          This page is a temporary placeholder. Online giving options will be
          available here soon. Thank you for your generosity and support of
          Journey Christian Ministries.
        </p>
      </div>
    </div>
  );
}
