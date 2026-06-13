/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "\"Helvetica Neue\"", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "\"Source Code Pro\"", "\"Fira Code\"", "monospace"]
      }
    }
  },
  plugins: []
};
