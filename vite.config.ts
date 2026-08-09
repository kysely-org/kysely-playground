import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "/",
  server: {
    proxy: {
      // `pnpm dev` has no worker - proxy the shortener api to production, or
      // to `wrangler dev` (http://127.0.0.1:8787) via VITE_API_PROXY_TARGET.
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "https://play.kysely.dev",
        changeOrigin: true,
      },
    },
  },
  plugins: [visualizer()],
  build: {
    sourcemap: false,
    rollupOptions: {
      cache: false,
    },
  },
});
