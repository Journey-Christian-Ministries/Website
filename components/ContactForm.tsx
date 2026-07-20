"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { contactLimits } from "@/lib/site";

// Exact user-facing messages required by the spec.
const MESSAGES = {
  turnstile:
    "We could not verify your submission. Please complete the security verification again and resubmit the form.",
  network:
    "Your message was not sent because the connection was interrupted. Please check your internet connection and resubmit the form.",
  delivery:
    "Your message could not be delivered because the website's email service is temporarily unavailable. Your information has not been sent. Please wait five minutes and resubmit the form.",
  unexpected:
    "An unexpected system error prevented your message from being sent. Your information has not been submitted. Please refresh the page, re-enter your message, and submit it again.",
  success:
    "Thank you for contacting Journey Christian Ministries. Your message has been sent successfully. Please allow 1\u20132 business days for a response.",
} as const;

type Fields = "name" | "email" | "subject" | "message";
type FormState = Record<Fields, string>;
type FieldErrors = Partial<Record<Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

function validateField(field: Fields, value: string): string | undefined {
  const v = value.trim();
  if (!v) {
    const labels: Record<Fields, string> = {
      name: "Full Name",
      email: "Email Address",
      subject: "Subject",
      message: "Message",
    };
    return `${labels[field]} is required. Please enter your ${labels[
      field
    ].toLowerCase()}.`;
  }
  if (field === "email" && !EMAIL_RE.test(v)) {
    return "Please enter a valid email address (for example, name@example.com).";
  }
  if (v.length > contactLimits[field]) {
    return `This field must be ${contactLimits[field]} characters or fewer.`;
  }
  return undefined;
}

export default function ContactForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string | null;
}) {
  const [values, setValues] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>("");
  const [scriptReady, setScriptReady] = useState(false);

  const renderWidget = useCallback(() => {
    if (
      !turnstileSiteKey ||
      !window.turnstile ||
      !widgetRef.current ||
      widgetIdRef.current
    ) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => {
        tokenRef.current = token;
      },
      "expired-callback": () => {
        tokenRef.current = "";
      },
      "error-callback": () => {
        tokenRef.current = "";
      },
    });
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (scriptReady) renderWidget();
  }, [scriptReady, renderWidget]);

  const resetWidget = useCallback(() => {
    tokenRef.current = "";
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  function update(field: Fields, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
    if (succeeded) setSucceeded(false);
  }

  function validateAll(): FieldErrors {
    const next: FieldErrors = {};
    (Object.keys(values) as Fields[]).forEach((f) => {
      const err = validateField(f, values[f]);
      if (err) next[f] = err;
    });
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const fieldErrors = validateAll();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setFormError("Please correct the highlighted fields and resubmit.");
      return;
    }
    setErrors({});

    if (!turnstileSiteKey) {
      setFormError(MESSAGES.delivery);
      return;
    }

    if (!tokenRef.current) {
      setFormError(MESSAGES.turnstile);
      resetWidget();
      return;
    }

    setSubmitting(true);
    let res: Response;
    try {
      res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
          turnstileToken: tokenRef.current,
        }),
      });
    } catch {
      // Network / connection interrupted.
      setSubmitting(false);
      setFormError(MESSAGES.network);
      resetWidget();
      return;
    }

    let data: { ok?: boolean; code?: string; field?: Fields } = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON response — treat as unexpected.
    }

    setSubmitting(false);
    // Turnstile token is single-use; refresh for any subsequent submission.
    resetWidget();

    if (res.ok && data.ok) {
      setSucceeded(true);
      setValues({ name: "", email: "", subject: "", message: "" });
      setErrors({});
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1800);
      return;
    }

    switch (data.code) {
      case "turnstile-failed":
        setFormError(MESSAGES.turnstile);
        break;
      case "validation":
        if (data.field) {
          setErrors((prev) => ({
            ...prev,
            [data.field as Fields]: validateField(
              data.field as Fields,
              values[data.field as Fields]
            ),
          }));
        }
        setFormError("Please correct the highlighted fields and resubmit.");
        break;
      case "delivery-failed":
        setFormError(MESSAGES.delivery);
        break;
      default:
        setFormError(MESSAGES.unexpected);
    }
  }

  const disabled = !turnstileSiteKey;

  return (
    <div className="card">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FieldInput
          id="name"
          label="Full Name"
          value={values.name}
          error={errors.name}
          maxLength={contactLimits.name}
          autoComplete="name"
          onChange={(v) => update("name", v)}
          disabled={disabled || submitting}
        />
        <FieldInput
          id="email"
          label="Email Address"
          type="email"
          value={values.email}
          error={errors.email}
          maxLength={contactLimits.email}
          autoComplete="email"
          onChange={(v) => update("email", v)}
          disabled={disabled || submitting}
        />
        <FieldInput
          id="subject"
          label="Subject"
          value={values.subject}
          error={errors.subject}
          maxLength={contactLimits.subject}
          onChange={(v) => update("subject", v)}
          disabled={disabled || submitting}
        />

        <div className="form-row">
          <label htmlFor="message">
            Message <span className="req" aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            maxLength={contactLimits.message}
            value={values.message}
            aria-required="true"
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            onChange={(e) => update("message", e.target.value)}
            disabled={disabled || submitting}
          />
          <span className="char-count" aria-hidden="true">
            {values.message.length}/{contactLimits.message}
          </span>
          {errors.message && (
            <span className="field-error" id="message-error">
              {errors.message}
            </span>
          )}
        </div>

        {turnstileSiteKey ? (
          <div className="turnstile-wrap" ref={widgetRef} />
        ) : (
          <p className="form-status error">
            The contact form is temporarily unavailable. Please try again later.
          </p>
        )}

        {/* Assertive live region for errors. */}
        <div aria-live="assertive" role="alert">
          {formError && <p className="form-status error">{formError}</p>}
        </div>
        {/* Polite live region for success. */}
        <div aria-live="polite">
          {succeeded && (
            <p className="form-status success">
              <span aria-hidden="true">✓ </span>
              {MESSAGES.success}
            </p>
          )}
        </div>

        <div className="submit-wrap">
          {celebrate && (
            <div className="celebrate" aria-hidden="true">
              <span>🙌</span>
              <span>🙌</span>
              <span>🙌</span>
              <span>🙌</span>
            </div>
          )}
          <button
            type="submit"
            className={`btn primary${succeeded ? " success" : ""}`}
            disabled={disabled || submitting}
          >
            {succeeded
              ? "Message Sent ✓"
              : submitting
                ? "Sending\u2026"
                : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldInput({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  maxLength,
  autoComplete,
  disabled,
}: {
  id: Fields;
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength: number;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="form-row">
      <label htmlFor={id}>
        {label} <span className="req" aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        maxLength={maxLength}
        autoComplete={autoComplete}
        value={value}
        aria-required="true"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
