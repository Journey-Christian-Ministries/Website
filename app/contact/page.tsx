import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Journey Christian Ministries in Detroit, Michigan. Send us a message and find our location.",
  openGraph: {
    title: "Contact",
    description:
      "Contact Journey Christian Ministries in Detroit, Michigan. Send us a message and find our location.",
  },
};

const MAP_QUERY = encodeURIComponent(
  "4330 W. Davison Ave., Detroit, Michigan"
);

export default function ContactPage() {
  // TURNSTILE_SITE_KEY is public but intentionally NOT NEXT_PUBLIC_ —
  // it is read server-side and passed to the client form as a prop.
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? null;

  return (
    <div className="page">
      <div className="eyebrow">Contact</div>
      <h1 className="page-title">Contact Journey</h1>
      <p className="lead">
        We&rsquo;d love to hear from you. Send us a message using the form below
        and a member of our team will respond soon. You can also visit us at{" "}
        <strong>{siteConfig.addressLine}</strong>.
      </p>

      <div className="contact-grid">
        <div>
          <h2 className="section-title" style={{ fontSize: "1.6rem", margin: "8px 0 14px" }}>
            Visit Us
          </h2>
          <p className="lead" style={{ fontSize: "1.05rem" }}>
            {siteConfig.addressLine}
          </p>
          <div className="map-frame" style={{ marginTop: 16 }}>
            <iframe
              title={`Map to ${siteConfig.name}`}
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div>
          <h2
            className="section-title"
            style={{ fontSize: "1.6rem", margin: "8px 0 14px" }}
          >
            Send a Message
          </h2>
          <ContactForm turnstileSiteKey={turnstileSiteKey} />
        </div>
      </div>
    </div>
  );
}
