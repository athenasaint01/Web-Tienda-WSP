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
        paper: "#faf4ee",   // lino claro — entre banner y productos
      },
      borderRadius: {
        brand: "1.5rem",
      },
    },
  },
  plugins: [],
};
