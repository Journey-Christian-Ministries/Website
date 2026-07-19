import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactLimits } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode = "validation" | "turnstile-failed" | "delivery-failed" | "unexpected";
type Field = "name" | "email" | "subject" | "message";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorResponse(code: ErrorCode, status: number, field?: Field) {
  return NextResponse.json({ ok: false, code, ...(field ? { field } : {}) }, { status });
}

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, code: "unexpected" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export function GET() {
  return methodNotAllowed();
}
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

// Reject CR/LF to prevent email header injection in any value that may reach a header.
const hasControlChars = (v: string) => /[\r\n]/.test(v);

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Server-side validation mirroring the client rules. Returns the first
// offending field, or null when everything is valid.
function validate(fields: Record<Field, string>): Field | null {
  const order: Field[] = ["name", "email", "subject", "message"];
  for (const f of order) {
    const value = fields[f];
    if (typeof value !== "string" || value.trim().length === 0) return f;
    if (value.trim().length > contactLimits[f]) return f;
    if (f !== "message" && hasControlChars(value)) return f; // header-injection guard
    if (f === "email" && !EMAIL_RE.test(value.trim())) return f;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("validation", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const fields: Record<Field, string> = {
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    email: typeof raw.email === "string" ? raw.email.trim() : "",
    subject: typeof raw.subject === "string" ? raw.subject.trim() : "",
    message: typeof raw.message === "string" ? raw.message.trim() : "",
  };
  const turnstileToken =
    typeof raw.turnstileToken === "string" ? raw.turnstileToken : "";

  const invalidField = validate(fields);
  if (invalidField) {
    return errorResponse("validation", 400, invalidField);
  }

  // --- Cloudflare Turnstile verification (server-side) ---
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    console.error("[contact] TURNSTILE_SECRET_KEY is not configured.");
    return errorResponse("turnstile-failed", 500);
  }
  if (!turnstileToken) {
    return errorResponse("turnstile-failed", 400);
  }

  try {
    const remoteIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";
    const form = new URLSearchParams();
    form.append("secret", turnstileSecret);
    form.append("response", turnstileToken);
    if (remoteIp) form.append("remoteip", remoteIp);

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    const verifyData = (await verifyRes.json()) as { success?: boolean };
    if (!verifyData.success) {
      return errorResponse("turnstile-failed", 400);
    }
  } catch (err) {
    console.error("[contact] Turnstile verification error:", err);
    return errorResponse("turnstile-failed", 502);
  }

  // --- Send email via Resend ---
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[contact] RESEND_API_KEY is not configured.");
    return errorResponse("delivery-failed", 500);
  }

  try {
    const resend = new Resend(resendApiKey);
    const { name, email, subject, message } = fields;

    const textBody = [
      "New message from the Journey Christian Ministries website contact form.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;color:#101828">
        <h2 style="color:#111553">New website contact message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>`;

    const { error } = await resend.emails.send({
      from: "Journey Christian Ministries Website <website@journeychristianministries.org>",
      to: "admin@journeychristianministries.org",
      replyTo: email,
      subject: `[Website Contact] ${subject}`,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error("[contact] Resend delivery error:", error);
      return errorResponse("delivery-failed", 502);
    }
  } catch (err) {
    console.error("[contact] Unexpected error sending email:", err);
    return errorResponse("unexpected", 500);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
