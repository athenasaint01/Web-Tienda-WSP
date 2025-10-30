/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        script: ["Great Vibes", "cursive"],
      },
      colors: {
        ink: "#111827",     // negro suave
        paper: "#ffffff",   // blanco
      },
      borderRadius: {
        brand: "1.5rem",
      },
    },
  },
  plugins: [],
};
