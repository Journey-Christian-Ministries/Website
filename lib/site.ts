export const siteConfig = {
  name: "Journey Christian Ministries",
  shortName: "Journey Christian Ministries",
  description:
    "A Christ-centered church family in Detroit, Michigan where faith grows, lives are strengthened, and people are welcomed with love as they walk with God.",
  url: "https://journeychristianministries.org",
  city: "Detroit, Michigan",
  address: {
    street: "4330 W. Davison Ave.",
    locality: "Detroit",
    region: "MI",
    regionName: "Michigan",
    country: "US",
  },
  addressLine: "4330 W. Davison Ave., Detroit, Michigan",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/media", label: "Media" },
  { href: "/give", label: "Give" },
  { href: "/contact", label: "Contact" },
] as const;

// Field length limits shared by the contact form (client) and API route (server).
export const contactLimits = {
  name: 100,
  email: 254,
  subject: 150,
  message: 5000,
} as const;
