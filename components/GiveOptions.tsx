"use client";

import { useState } from "react";
import Image from "next/image";
import CopyEmailButton from "@/components/CopyEmailButton";

const ZELLE_EMAIL = "myjourneychurch@icloud.com";

export default function GiveOptions() {
  const [zelleOpen, setZelleOpen] = useState(false);

  return (
    <div className="give-actions">
      <a
        className="btn primary give-btn"
        href="https://giv.li/5daawz"
        target="_blank"
        rel="noopener noreferrer"
      >
        Give with Givelify
      </a>

      <div className="give-option">
        <button
          type="button"
          className="btn primary give-btn"
          aria-expanded={zelleOpen}
          aria-controls="zelle-panel"
          onClick={() => setZelleOpen((open) => !open)}
        >
          Give with Zelle
        </button>

        <div
          className={`give-collapse${zelleOpen ? " open" : ""}`}
          aria-hidden={!zelleOpen}
        >
          <div className="give-collapse-inner">
            <section id="zelle-panel" className="card give-zelle">
              <h2 className="give-zelle-title">Give with Zelle</h2>
              <p className="give-zelle-intro">
                Send your gift through Zelle using the email address below, or
                scan the QR code from another device.
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
        </div>
      </div>
    </div>
  );
}
