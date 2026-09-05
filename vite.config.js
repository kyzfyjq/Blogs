import { defineConfig } from "vite";
import { globSync } from "node:fs";
import vue from "@vitejs/plugin-vue";
import { getPageTypeConfig } from "./src/core/pageTypes.js";
import { MATHJAX_CONFIG, MATHJAX_SOURCE_URL, htmlHasTex } from "./src/core/mathjax.js";
import { SITE_BASE } from "./src/config/site.js";

const pageInputs = Object.fromEntries(
  globSync("src/pages/**/*.html").map((file) => [file.replace(/^src\/pages\//, "").replace(/\.html$/, ""), file]),
);

function readPageType(html) {
  return html.match(/<meta\s+name="page-type"\s+content="([^"]+)"/i)?.[1] ?? null;
}

export default defineConfig({
  base: SITE_BASE,
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

          const tags = [];

          if (htmlHasTex(html)) {
            tags.push(
              {
                tag: "script",
                children: MATHJAX_CONFIG,
                injectTo: "head-prepend",
              },
              {
                tag: "script",
                attrs: {
                  src: MATHJAX_SOURCE_URL,
                  defer: true,
                },
                injectTo: "head-prepend",
              },
            );
          }

          tags.push({
            tag: "script",
            attrs: {
              type: "module",
              src: pageTypeConfig.entry,
            },
            injectTo: "body",
          });

          return tags;
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
