"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const ZELLE_EMAIL = "myjourneychurch@icloud.com";

export default function GiveOptions() {
  const [zelleOpen, setZelleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const openTriggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(ZELLE_EMAIL);
      showToast("Zelle email address copied.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = ZELLE_EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Zelle email address copied.");
    }
  }

  const openModal = useCallback((trigger: HTMLElement) => {
    openTriggerRef.current = trigger;
    setZelleOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setZelleOpen(false);
    openTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (zelleOpen) closeButtonRef.current?.focus();
  }, [zelleOpen]);

  useEffect(() => {
    if (!zelleOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zelleOpen, closeModal]);

  return (
    <>
      <div className="giving-grid">
        <article className="give-card">
          <span className="option">Online Giving</span>
          <div className="give-icon">G</div>
          <h2>Give with Givelify</h2>
          <p>
            Make a secure online gift using Journey&rsquo;s official Givelify
            page. Choose your amount and complete your gift in just a few
            steps.
          </p>
          <div className="actions">
            <a
              className="cta"
              href="https://giv.li/5daawz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Continue to Givelify</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>

        <article className="give-card zelle">
          <span className="option">Bank-to-Bank Giving</span>
          <div className="give-icon">Z</div>
          <h2>Give with Zelle</h2>
          <p>
            Send your gift from your bank&rsquo;s app using Journey&rsquo;s
            current Zelle email address.
          </p>
          <div className="email-box">
            <span>{ZELLE_EMAIL}</span>
            <button type="button" onClick={copyEmail}>
              Copy email
            </button>
          </div>
          <p className="qr-note">
            On a computer? View the official QR code and scan it with your
            phone.
          </p>
          <div className="actions">
            <button
              type="button"
              className="cta"
              onClick={(e) => openModal(e.currentTarget)}
              aria-haspopup="dialog"
            >
              <span>View Zelle details</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
      </div>

      {zelleOpen && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zelle-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="dialog">
            <div className="modal-head">
              <span id="zelle-modal-title">Give with Zelle</span>
              <button
                type="button"
                className="close"
                aria-label="Close"
                ref={closeButtonRef}
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            <div className="zelle-detail">
              <div>
                <p>Open Zelle in your bank&rsquo;s app and send your gift to:</p>
                <strong>{ZELLE_EMAIL}</strong>
                <div>
                  <button type="button" className="zelle-copy" onClick={copyEmail}>
                    Copy email address
                  </button>
                </div>
              </div>
              <figure>
                <Image
                  src="/zelle-qr.png"
                  alt={`Zelle QR code for ${ZELLE_EMAIL}`}
                  width={200}
                  height={200}
                />
                <figcaption>Scan from another device</figcaption>
              </figure>
            </div>
          </div>
        </div>
      )}

      <div
        className={`toast${toast ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
