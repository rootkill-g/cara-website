import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

// Solid + Tailwind v4 (the Tailwind plugin replaces postcss config entirely).
export default defineConfig({
  plugins: [solid(), tailwindcss()],
});
