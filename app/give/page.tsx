import type { Metadata } from "next";
import Image from "next/image";
import CopyEmailButton from "@/components/CopyEmailButton";

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

const ZELLE_EMAIL = "myjourneychurch@icloud.com";

export default function GivePage() {
  return (
    <div className="page">
      <div className="eyebrow">Give</div>
      <h1 className="page-title">Give</h1>
      <p className="lead">
        Thank you for supporting the ministry of Journey Christian Ministries.
        Choose one of the giving options below.
      </p>

      <div className="give-actions">
        <a
          className="btn primary give-btn"
          href="https://giv.li/5daawz"
          target="_blank"
          rel="noopener noreferrer"
        >
          Give with Givelify
        </a>
        <a className="btn give-btn" href="#zelle">
          Give with Zelle
        </a>
      </div>

      <section id="zelle" className="card give-zelle">
        <h2 className="give-zelle-title">Give with Zelle</h2>
        <p className="give-zelle-intro">
          Send your gift through Zelle using the email address below, or scan the
          QR code from another device.
        </p>

        <div className="zelle-email-row">
          <span className="zelle-email">{ZELLE_EMAIL}</span>
          <CopyEmailButton email={ZELLE_EMAIL} />
        </div>

        <figure className="zelle-qr">
          <Image
            src="/zelle-qr.png"
            alt={`Zelle QR code for ${ZELLE_EMAIL}`}
            width={200}
            height={200}
          />
          <figcaption>Scan to give with Zelle</figcaption>
        </figure>
      </section>
    </div>
  );
}
