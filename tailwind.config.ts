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
        ink: { DEFAULT: "#17201D", soft: "#5C6B66" },
        paper: { DEFAULT: "#FBFBF8", card: "#FFFFFF", line: "#E6E8E2", wash: "#F4F1EC" },
        brand: { DEFAULT: "#025B4C", soft: "#0B7A63", mint: "#71C3C4" },
        copper: { DEFAULT: "#E16000", deep: "#B24700", soft: "#F0B37A" },
        good: { DEFAULT: "#1E7A57", tint: "#E5F2EC", line: "#BFE0CD" },
        warn: { DEFAULT: "#A9781A", tint: "#F6ECCF", line: "#E3D3AD" },
        danger: { DEFAULT: "#C0392B", tint: "#F7E1DE", line: "#E0B8B2" },
        info: { DEFAULT: "#1D5FA8", tint: "#E6EEFA", line: "#C2D5F0" },
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
