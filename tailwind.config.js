/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#d71920",
          dark: "#a80f15",
        },
        ink: "#0b1220",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,.08), 0 8px 24px rgba(16,24,40,.06)",
        "card-hover": "0 4px 10px rgba(16,24,40,.1), 0 18px 36px rgba(16,24,40,.12)",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  safelist: [
    {
      pattern: /bg-(red|green|blue)-(100|200|300)/,
      variants: ["hover", "focus"],
    },
    {
      pattern: /text-(sm|md|lg)/,
      variants: ["hover", "focus"],
    },
    {
      pattern: /border-(solid|dashed|dotted)/,
      variants: ["hover", "focus"],
    },
    {
      pattern: /p-(1|2|3)/,
      variants: ["hover", "focus"],
    },
    {
      pattern: /m-(1|2|3)/,
      variants: ["hover", "focus"],
    },
  ],
  plugins: [],
};