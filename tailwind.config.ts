import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: "#2d35c7",
        deep: "#111553",
        sky: "#16b9ee",
        gold: "#d7a232",
        ink: "#101828",
        soft: "#f7fcff",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
