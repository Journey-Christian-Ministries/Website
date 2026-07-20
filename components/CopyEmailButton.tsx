"use client";

import { useState } from "react";

export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Fallback for browsers without the async clipboard API.
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className="btn copy-email-btn" onClick={copy}>
      <span aria-live="polite">{copied ? "Email Copied ✓" : "Copy Email"}</span>
    </button>
  );
}
