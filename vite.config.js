import path from "node:path";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { globSync } from "node:fs";

import { SITE_BASE } from "./src/config/site.js";
import { MATHJAX_CONFIG, MATHJAX_SOURCE_URL, htmlHasTex } from "./src/core/mathjax.js";
import { getPageTypeConfig } from "./src/core/pageTypes.js";
import {
  buildSiteModel,
  cleanupGeneratedPages,
  promoteGeneratedPages,
  renderCategoryPage,
  renderTimeSortedPage,
  writeGeneratedPages,
} from "./scripts/site.js";

const authoredInputs = Object.fromEntries(
  globSync("src/pages/**/*.html").map((file) => [file.replace(/^src\/pages\//, "").replace(/\.html$/, ""), file]),
);

function readPageType(html) {
  return html.match(/<meta\s+name="page-type"\s+content="([^"]+)"/i)?.[1] ?? null;
}

function pageTypePlugin() {
  return {
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
  };
}

function generatedSitePlugin({ command, model }) {
  let outDir = path.resolve("dist");

  return {
    name: "generated-site-pages",

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },

    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        try {
          const requestUrl = request.url ?? "";
          const pathname = decodeURIComponent(requestUrl.split("?")[0]);

          if (!pathname.startsWith(SITE_BASE)) {
            next();
            return;
          }

          const relativePath = pathname.slice(SITE_BASE.length);
          const siteModel = await buildSiteModel();
          let html = null;

          if (relativePath === "src/pages/time-sorted.html" || relativePath === "src/pages/time-sorted/") {
            html = renderTimeSortedPage(siteModel.posts);
          } else if (relativePath.startsWith("src/pages/") && relativePath.endsWith("/")) {
            const key = relativePath.slice("src/pages/".length, -1);
            const directory = siteModel.directories.find((candidate) => candidate.key === key);

            if (directory) {
              html = renderCategoryPage(directory);
            }
          }

          if (!html) {
            next();
            return;
          }

          const transformedHtml = await server.transformIndexHtml(pathname, html);

          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(transformedHtml);
        } catch (error) {
          next(error);
        }
      });
    },

    async closeBundle() {
      if (command === "build" && model) {
        await promoteGeneratedPages(outDir, model);
      }

      await cleanupGeneratedPages();
    },
  };
}

export default defineConfig(async ({ command }) => {
  const generatedInputs = {};
  let model = null;

  if (command === "build") {
    model = await buildSiteModel();
    Object.assign(generatedInputs, await writeGeneratedPages(model));
  }

  return {
    base: SITE_BASE,
    plugins: [vue(), pageTypePlugin(), generatedSitePlugin({ command, model })],
    build: {
      rollupOptions: {
        input: {
          index: "index.html",
          ...authoredInputs,
          ...generatedInputs,
        },
      },
    },
  };
});
