/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        bumblebee: {
          ...require("daisyui/src/theming/themes")["bumblebee"],
          "primary": "#f59e0b",
          "primary-focus": "#d97706",
          "primary-content": "#ffffff",
          "secondary": "#fbbf24",
          "accent": "#fde68a",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#fef3c7",
          "base-300": "#fde68a",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
}
