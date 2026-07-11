/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        display: ["Josefin Sans", "sans-serif"],
        script: ["Great Vibes", "cursive"],
      },
      colors: {
        ink: "#111827",     // negro suave
        paper: "#f9f5f2",   // warm off-white sin fatiga visual
      },
      borderRadius: {
        brand: "1.5rem",
      },
    },
  },
  plugins: [],
};
