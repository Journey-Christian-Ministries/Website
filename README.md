# Journey Christian Ministries — Website

Official website for Journey Christian Ministries (Detroit, Michigan).

Built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**, deployed on **Vercel**. The homepage is a faithful port of the approved static mock (`Journey Homepage.html`, kept in the repo as the approved reference along with `Journey_Christian_Ministries_Website_Project_Blueprint.md`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type check

## Project structure

- `app/` — App Router pages (`/`, `/about`, `/sermons`, `/give`, `/contact`, `/watch`) and the contact API route (`app/api/contact/route.ts`).
- `components/` — shared UI (`Header`, `Footer`, `LiveStrip`, `ContactForm`, `JsonLd`).
- `lib/site.ts` — shared site config, navigation, and contact field limits.
- `app/globals.css` — global styles ported from the approved homepage mock.
- `public/logo.png`, `public/pastors.png` — image assets extracted from the mock.

## Pages

- **Home** (`/`) — approved hero, schedule, about, and a **Live Now** strip that only appears when a service is live or within 10 minutes before it starts (Detroit/Eastern time, DST-aware), linking to the on-site `/watch` player.
- **Watch** (`/watch`) — embedded YouTube Live player. Uses a **placeholder** channel URL until the church's YouTube account is created.
- **About / Sermons / Give** — clearly-labeled temporary placeholders.
- **Contact** (`/contact`) — address, embedded Google Map, and a contact form (Cloudflare Turnstile + Resend email delivery). No phone number or email is displayed on the page.

## Environment variables

Three variables are required. **None are hardcoded.** Set them in **Vercel → Project Settings → Environment Variables** (values are populated by the site owner). See `.env.example` for the names.

| Name | Visibility | Purpose |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Public (server-read) | Cloudflare Turnstile site key. Read **server-side** and passed to the client contact form as a prop. Intentionally **not** prefixed with `NEXT_PUBLIC_`. |
| `TURNSTILE_SECRET_KEY` | Secret (server only) | Cloudflare Turnstile secret key, used to verify submissions server-side. |
| `RESEND_API_KEY` | Secret (server only) | [Resend](https://resend.com) API key used to deliver contact-form emails. |

**Graceful degradation:** if these are unset the app does not crash or leak errors:

- If `TURNSTILE_SITE_KEY` is unset, the contact form renders in a safe disabled state.
- If `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` is unset, the API responds with a user-facing message (e.g. "email service temporarily unavailable") and logs the detail server-side only.

For local development, copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

## Contact email

Contact-form submissions are delivered via Resend:

- **From:** `Journey Christian Ministries Website <website@journeychristianministries.org>`
- **To:** `admin@journeychristianministries.org`
- **Reply-To:** the visitor's submitted email address

The sending domain must be verified in Resend for delivery to succeed.

## Deployment

Deployed on Vercel targeting `journeychristianministries.org`. Ensure the three environment variables above are configured in the Vercel project before going live.
