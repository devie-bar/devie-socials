import type { Config } from "tailwindcss";

/**
 * Colours, faces and radii come from DESIGN.md (De Vie Design Standard, Part 2).
 * Do not add a value here that is not in that file.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "600px", md: "840px", lg: "1200px" },
    borderRadius: {
      none: "0",
      chip: "2px",
      control: "10px",
      inner: "8px",
      module: "12px",
      media: "8px",
      full: "9999px",
    },
    extend: {
      boxShadow: { overlay: "0 6px 20px rgba(2, 91, 76, .07)" },
      colors: {
        ink: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", soft: "rgb(var(--c-ink-soft) / <alpha-value>)" },
        paper: { DEFAULT: "rgb(var(--c-paper) / <alpha-value>)", card: "rgb(var(--c-card) / <alpha-value>)", line: "rgb(var(--c-line) / <alpha-value>)", wash: "rgb(var(--c-wash) / <alpha-value>)" },
        brand: { DEFAULT: "#025B4C", soft: "#0B7A63", mint: "#71C3C4" },
        copper: { DEFAULT: "#E16000", deep: "#B24700", soft: "#F0B37A" },
        good: { DEFAULT: "rgb(var(--c-good) / <alpha-value>)", tint: "rgb(var(--c-good-tint) / <alpha-value>)", line: "rgb(var(--c-good-line) / <alpha-value>)" },
        warn: { DEFAULT: "rgb(var(--c-warn) / <alpha-value>)", tint: "rgb(var(--c-warn-tint) / <alpha-value>)", line: "rgb(var(--c-warn-line) / <alpha-value>)" },
        danger: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", tint: "rgb(var(--c-danger-tint) / <alpha-value>)", line: "rgb(var(--c-danger-line) / <alpha-value>)" },
        info: { DEFAULT: "rgb(var(--c-info) / <alpha-value>)", tint: "rgb(var(--c-info-tint) / <alpha-value>)", line: "rgb(var(--c-info-line) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["Epilogue", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
        display: ["PP Editorial New", "Cambria", "Hoefler Text", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
