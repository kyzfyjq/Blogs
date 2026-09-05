import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { load } from "cheerio";

import { getPageTypeConfig } from "../src/core/pageTypes.js";
import { SITE_BASE, pageUrl } from "../src/config/site.js";
import { Page } from "../src/models/page.js";
import { getPages } from "./getPages.js";

const pageRootDir = "./src/pages";
const outputFile = "./src/data/pagesData.json";
const homePagePath = "./index.html";

function gitLastModifiedDate(filePath) {
  const relativePath = path.relative(process.cwd(), path.resolve(filePath));

  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cI", "--", relativePath], { encoding: "utf8" }).trim();

    return date || null;
  } catch {
    return null;
  }
}

function metaContent($, name) {
  return $(`meta[name="${name}"]`).attr("content") ?? null;
}

// Node.js Only
export async function extractPage(filePath, options = {}) {
  const html = await fs.readFile(filePath, "utf8");
  const $ = load(html);

  const pageType = metaContent($, "page-type");

  if (!pageType) {
    throw new Error(`${filePath} is missing the required meta[name="page-type"]`);
  }
  if (!getPageTypeConfig(pageType)) {
    throw new Error(`${filePath} declares unknown page-type "${pageType}"`);
  }

  const title = metaContent($, "title");
  const summary = metaContent($, "summary");
  const createdDate = metaContent($, "createdDate");

  if (pageType === "post" && !createdDate) {
    throw new Error(`${filePath} is a post and requires meta[name="createdDate"]`);
  }

  const relativePath = path.relative(pageRootDir, filePath);
  const directory = path.dirname(relativePath);
  const categoryPath = directory === "." ? [] : directory.split(path.sep);
  const slug = path.basename(relativePath, ".html");
  const lastModifiedDate = gitLastModifiedDate(filePath) ?? createdDate;

  return new Page({
    path: relativePath,
    url: pageUrl(relativePath),
    slug,
    pageType,
    title,
    summary,
    createdDate,
    lastModifiedDate,
    categoryPath,
    ...options,
  });
}

async function generatePagesData() {
  const pagesData = [];

  pagesData.push(
    await extractPage(homePagePath, {
      path: "index.html",
      url: SITE_BASE,
      slug: "index",
      categoryPath: [],
    }),
  );

  const pagePaths = await getPages(pageRootDir);

  for (const filePath of pagePaths) {
    pagesData.push(await extractPage(filePath));
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(pagesData, null, 4));
}

generatePagesData();
