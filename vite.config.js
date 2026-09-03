import { defineConfig } from "vite";
import { globSync } from "node:fs";
import vue from "@vitejs/plugin-vue";

const pageInputs = Object.fromEntries(
  globSync("src/pages/**/*.html").map((file) => [file.replace(/^src\/pages\//, "").replace(/\.html$/, ""), file]),
);

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "inject-base-js",
      transformIndexHtml: {
        order: "pre",

        handler() {
          return [
            {
              tag: "script",
              attrs: {
                type: "module",
                src: "/src/scripts/base.js",
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
