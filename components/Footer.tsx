import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer>© {siteConfig.name} • {siteConfig.city}</footer>
  );
}
