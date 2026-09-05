import { defineConfig } from "vite";
import { globSync } from "node:fs";
import vue from "@vitejs/plugin-vue";
import { getPageTypeConfig } from "./src/core/pageTypes.js";

const pageInputs = Object.fromEntries(
  globSync("src/pages/**/*.html").map((file) => [file.replace(/^src\/pages\//, "").replace(/\.html$/, ""), file]),
);

function readPageType(html) {
  return html.match(/<meta\s+name="page-type"\s+content="([^"]+)"/i)?.[1] ?? null;
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "inject-page-entry",
      transformIndexHtml: {
        order: "pre",

        handler(html, context) {
          const pageType = readPageType(html);
          const pageTypeConfig = getPageTypeConfig(pageType);

          if (!pageTypeConfig) {
            throw new Error(`${context?.filename ?? "html"}: missing or unknown meta[name="page-type"]`);
          }

          return [
            {
              tag: "script",
              attrs: {
                type: "module",
                src: pageTypeConfig.entry,
              },
              injectTo: "body",
            },
          ];
        },
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        ...pageInputs,
      },
    },
  },
});
