import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f4",
          100: "#d9f0e3",
          200: "#b4e1c8",
          300: "#86d1a8",
          400: "#55b783",
          500: "#2f9461",
          600: "#237a4f",
          700: "#1d6341",
          900: "#12402a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
