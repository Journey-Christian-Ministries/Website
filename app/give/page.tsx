import type { Metadata } from "next";
import GiveOptions from "@/components/GiveOptions";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Support the ministry of Journey Christian Ministries through Givelify or Zelle.",
  openGraph: {
    title: "Give",
    description:
      "Support the ministry of Journey Christian Ministries through Givelify or Zelle.",
  },
};

export default function GivePage() {
  return (
    <div className="page give-page">
      <div className="page-head giving-intro">
        <div>
          <p className="eyebrow">Support the Ministry</p>
          <h1 className="page-title">
            Giving is part
            <br />
            of the <span className="accent">journey.</span>
          </h1>
        </div>
        <p className="giving-quote">
          Your generosity helps Journey Christian Ministries continue sharing
          God&rsquo;s Word, serving families, and creating a place where
          people can grow in faith.
        </p>
      </div>

      <GiveOptions />

      <div className="impact">
        <div>
          <b>Ministry</b>
          <span>Supporting biblical teaching and worship.</span>
        </div>
        <div>
          <b>Community</b>
          <span>Helping Journey serve local families.</span>
        </div>
        <div>
          <b>Connection</b>
          <span>Making it easier for people to participate and grow.</span>
        </div>
      </div>
    </div>
  );
}
