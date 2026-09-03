import fs from "node:fs/promises";
import path from "node:path";

import { load } from "cheerio";

import { Page } from "../src/models/page.js";
import { getPages } from "./getPages.js";

const pageRootDir = "./src/pages";
const outputFile = "./src/data/pagesData.json";
const homePagePath = "./index.html";

// Node.js Only
export async function extractPage(filePath, options = {}) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html);

  // HTML Metadata
  const title = $('meta[name="title"]').attr("content");
  const label = $('meta[name="label"]').attr("content") ?? title;
  const summary = $('meta[name="summary"]').attr("content");
  const releaseDate = $('meta[name="releaseDate"]').attr("content");

  // File system metadata
  const stats = await fs.stat(filePath);
  const relativePath = path.relative(pageRootDir, filePath);
  const directory = path.dirname(relativePath);
  const categories = directory === "." ? [] : directory.split(path.sep);

  return new Page({
    path: relativePath,
    url: `/src/pages/${relativePath}`,
    title,
    label,
    summary,
    releaseDate,
    lastModifiedDate: stats.mtime.toISOString(),
    categories,
    ...options,
  });
}

async function generatePagesData() {
  const pagesData = [];

  pagesData.push(
    await extractPage(homePagePath, {
      path: "index.html",
      url: "/",
      categories: [],
    }),
  );

  const pagePaths = await getPages(pageRootDir);

  for (const filePath of pagePaths) {
    const pageData = await extractPage(filePath);
    pagesData.push(pageData);
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(pagesData, null, 4));
}

generatePagesData();
