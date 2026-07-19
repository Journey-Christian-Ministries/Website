import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Journey Christian Ministries — a welcoming, Christ-centered church family in Detroit, Michigan.",
  openGraph: {
    title: "About",
    description:
      "Learn about Journey Christian Ministries — a welcoming, Christ-centered church family in Detroit, Michigan.",
  },
};

export default function AboutPage() {
  return (
    <div className="page">
      <div className="eyebrow">About</div>
      <h1 className="page-title">About Journey</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <span className="placeholder-badge">Coming Soon</span>
        <p className="lead" style={{ margin: 0 }}>
          {/* PLACEHOLDER: real About content (mission, beliefs, heart for the
              community, pastor bio) will be added when provided by the church.
              Do not invent content. */}
          This page is a temporary placeholder. Our full story — our mission,
          beliefs, and heart for the Detroit community — is on the way. In the
          meantime, we&rsquo;d love to welcome you at a service.
        </p>
      </div>
    </div>
  );
}
