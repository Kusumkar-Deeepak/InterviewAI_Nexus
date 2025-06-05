/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        dark: "#1E293B",
        light: "#F8FAFC",
      },
    },
  },
  plugins: [],
}

