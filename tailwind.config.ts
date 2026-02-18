import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#004AAD",
          teal: "#00B8A9"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      },
      backgroundImage: {
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;

