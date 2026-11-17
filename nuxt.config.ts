import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  ssr: true,
  runtimeConfig: {
    tmdbReadToken: "",
    tmdbApiBase: "https://api.themoviedb.org/3",
  },
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      title: "Кадр — найдите свою историю",
      meta: [
        {
          name: "description",
          content:
            "Хорошее кино начинается с выбора. Открывайте фильмы, знакомьтесь с их создателями и собирайте свою коллекцию.",
        },
        { name: "theme-color", content: "#111212" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
  typescript: { strict: true },
  nitro: { compressPublicAssets: true },
  routeRules: {
    "/images/**": {
      headers: { "cache-control": "public, max-age=31536000, immutable" },
    },
    "/fonts/**": {
      headers: { "cache-control": "public, max-age=31536000, immutable" },
    },
  },
});
