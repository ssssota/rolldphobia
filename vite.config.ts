import { defineConfig } from "vite";
import unocss from "unocss/vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), unocss()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  experimental: {
    enableNativePlugin: "resolver",
  },
});
