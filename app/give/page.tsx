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
    <div className="page">
      <h1 className="page-title">Give</h1>
      <p className="lead">
        Thank you for supporting Journey Christian Ministries. Select a giving
        method below.
      </p>

      <GiveOptions />
    </div>
  );
}
