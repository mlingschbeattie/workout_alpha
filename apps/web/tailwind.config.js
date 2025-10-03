/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#D62828", // primary accent
          dark: "#0B0B0B", // near-black bg
          light: "#FAFAFA",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.08)",
        nav: "0 2px 12px rgba(0,0,0,0.08)",
      },
      fontSize: {
        "hero": ["clamp(2rem,4vw,3.25rem)", { lineHeight: "1.05" }],
      },
      borderRadius: {
        "2xl": "1.25rem",
      }
    },
  },
  plugins: [],
};

