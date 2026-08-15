import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite-plus";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    svelte(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "PTT Link Switcher",
        short_name: "PTT Switcher",
        description:
          "Parse and convert PTT article links across supported readers—entirely offline.",
        theme_color: "#12213a",
        background_color: "#12213a",
        display: "standalone",
        lang: "zh-Hant",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,webp,woff,woff2}"],
      },
    }),
  ],
});
