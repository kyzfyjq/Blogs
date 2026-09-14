import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { load } from "cheerio";

import { SITE_BASE, categoryUrl, pageUrl } from "../src/config/site.js";
import { getPageTypeConfig } from "../src/core/pageTypes.js";
import { Page } from "../src/models/page.js";
import { slugToDisplayName } from "../src/utils/displayName.js";
import { byCreatedDate, byTitle } from "../src/utils/pageSort.js";
import { getPages } from "./getPages.js";

export const pagesRoot = path.resolve("src/pages");
export const generatedRoot = path.resolve(".generated/pages");

const homePagePath = path.resolve("index.html");

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

  const relativePath = path.relative(pagesRoot, filePath);
  const directory = path.dirname(relativePath);
  const categoryPath = directory === "." ? [] : directory.split(path.sep);
  const slug = path.basename(relativePath, ".html");

  return new Page({
    path: relativePath,
    url: pageUrl(relativePath),
    slug,
    pageType,
    title,
    summary,
    createdDate,
    lastModifiedDate: gitLastModifiedDate(filePath) ?? createdDate,
    categoryPath,
    ...options,
  });
}

function hasPrefix(categoryPath, prefix) {
  return categoryPath.length >= prefix.length && prefix.every((segment, index) => categoryPath[index] === segment);
}

function samePath(a, b) {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

function sortCategoryPages(pages) {
  const dated = pages.filter((page) => page.createdDate).sort((a, b) => byCreatedDate(a, b) || byTitle(a, b));
  const undated = pages.filter((page) => !page.createdDate).sort(byTitle);

  return [...dated, ...undated];
}

export async function buildSiteModel() {
  const home = await extractPage(homePagePath, {
    path: "index.html",
    url: SITE_BASE,
    slug: "index",
    categoryPath: [],
  });
  const pagePaths = await getPages(pagesRoot);
  const pages = [];
  const directoriesByKey = new Map();

  function ensureDirectory(categoryPath) {
    const key = categoryPath.join("/");
    let directory = directoriesByKey.get(key);

    if (directory) {
      return directory;
    }

    directory = {
      categoryPath,
      key,
      title: slugToDisplayName(categoryPath.at(-1)),
      url: categoryUrl(categoryPath),
      directories: [],
      pages: [],
    };
    directoriesByKey.set(key, directory);

    if (categoryPath.length > 1) {
      ensureDirectory(categoryPath.slice(0, -1));
    }

    return directory;
  }

  for (const filePath of pagePaths) {
    const relativePath = path.relative(pagesRoot, filePath);

    if (path.basename(relativePath) === "index.html") {
      continue;
    }

    const page = await extractPage(filePath);

    pages.push(page);
    ensureDirectory(page.categoryPath);
  }

  const directories = [...directoriesByKey.values()].sort((a, b) => a.key.localeCompare(b.key));

  for (const directory of directories) {
    directory.directories = directories
      .filter(
        (candidate) =>
          candidate.categoryPath.length === directory.categoryPath.length + 1 && hasPrefix(candidate.categoryPath, directory.categoryPath),
      )
      .sort(byTitle);
    directory.pages = sortCategoryPages(pages.filter((page) => samePath(page.categoryPath, directory.categoryPath)));
  }

  const posts = pages.filter((page) => page.pageType === "post").sort((a, b) => byCreatedDate(a, b) || a.slug.localeCompare(b.slug));
  const timeSorted = new Page({
    path: "time-sorted.html",
    url: pageUrl("time-sorted.html"),
    slug: "time-sorted",
    pageType: "time-sorted",
    title: "Time Sorted",
    categoryPath: [],
  });
  const categoryPages = directories.map(
    (directory) =>
      new Page({
        path: `${directory.key}/index.html`,
        url: directory.url,
        slug: "index",
        pageType: "category",
        title: directory.title,
        categoryPath: directory.categoryPath,
      }),
  );

  return { home, posts, pages, directories, categoryPages, timeSorted };
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function documentShell({ pageType, title, body }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="page-type" content="${escapeHtml(pageType)}" />
    <meta name="title" content="${escapeHtml(title)}" />
  </head>
  <body>
    <div id="layout">
      <div id="content">
${body}
      </div>
    </div>
  </body>
</html>
`;
}

function renderEntries(entries) {
  return entries
    .map((entry) => {
      const date = entry.date ? `<time datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time>` : "";
      const className = entry.isDirectory ? "category-entry category-entry-directory" : "category-entry category-entry-page";

      return `          <a class="${className}" href="${escapeHtml(entry.href)}">${date}<span>${escapeHtml(entry.label)}</span></a>`;
    })
    .join("\n");
}

function renderGroup(title, entries) {
  if (entries.length === 0) {
    return "";
  }

  return `        <h2>${escapeHtml(title)}</h2>
        <div class="category-listing">
${renderEntries(entries)}
        </div>`;
}

function renderTree(directories, currentCategoryPath) {
  const items = directories
    .map((directory) => {
      const isOpen = hasPrefix(currentCategoryPath, directory.categoryPath);
      const isActive = samePath(currentCategoryPath, directory.categoryPath);
      const hasChildren = directory.directories.length > 0;
      const children = hasChildren
        ? `<ul class="site-tree-children">
${renderTree(directory.directories, currentCategoryPath)}
        </ul>`
        : "";

      return `        <li class="site-tree-item${isOpen ? " is-open" : ""}">
          <div class="site-tree-row">
            <a class="site-tree-link${isActive ? " is-active" : ""}" href="${escapeHtml(directory.url)}"${isActive ? ' aria-current="page"' : ""}>${escapeHtml(directory.title)}</a>
            ${
              hasChildren
                ? `<button class="site-tree-toggle" type="button" aria-expanded="${isOpen}" aria-label="Toggle ${escapeHtml(directory.title)}">▸</button>`
                : ""
            }
          </div>
${children}
        </li>`;
    })
    .join("\n");

  return items;
}

export function renderSiteHeader(model) {
  return `    <header id="site-header">
      <div class="site-header-inner">
        <button id="site-menu-toggle" class="site-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>
        <a class="site-brand" href="${escapeHtml(SITE_BASE)}">${escapeHtml(model.home.title)}</a>
        <nav class="site-header-nav" aria-label="Primary">
          <a href="${escapeHtml(model.timeSorted.url)}">Timeline</a>
          <a href="https://github.com/kyzfyjq/Blogs" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </header>`;
}

export function renderSiteSidebar(model, { categoryPath = [], pageType = null } = {}) {
  const topLevelDirectories = model.directories.filter((directory) => directory.categoryPath.length === 1);
  const homeActive = pageType === "home" ? " is-active" : "";
  const timelineActive = pageType === "time-sorted" ? " is-active" : "";

  return `    <div id="sidebar-backdrop"></div>
    <aside id="site-sidebar" aria-label="Site navigation">
      <nav class="site-sidebar-inner">
        <ul class="site-sidebar-primary">
          <li><a class="site-nav-link${homeActive}" href="${escapeHtml(model.home.url)}"${homeActive ? ' aria-current="page"' : ""}>Home</a></li>
          <li><a class="site-nav-link${timelineActive}" href="${escapeHtml(model.timeSorted.url)}"${timelineActive ? ' aria-current="page"' : ""}>Timeline</a></li>
        </ul>
        <div class="site-sidebar-divider"></div>
        <ul class="site-tree">
${renderTree(topLevelDirectories, categoryPath)}
        </ul>
      </nav>
    </aside>`;
}

export function renderCategoryPage(directory) {
  const directories = directory.directories.map((child) => ({
    href: child.url,
    label: `${child.title}/`,
    isDirectory: true,
  }));
  const pages = directory.pages.map((page) => ({
    href: page.url,
    label: page.title || slugToDisplayName(page.slug),
    date: page.createdDate,
  }));
  const sections = [renderGroup("Directories", directories), renderGroup("Pages", pages)].filter(Boolean).join("\n");

  return documentShell({
    pageType: "category",
    title: directory.title,
    body: `        <header>
          <h1>${escapeHtml(directory.title)}</h1>
        </header>
        <section id="children">
${sections}
        </section>`,
  });
}

export function renderTimeSortedPage(posts) {
  const entries = posts
    .map((post) => {
      const summary = post.summary ? `\n          <p>${escapeHtml(post.summary)}</p>` : "";

      return `        <article class="time-sorted-entry">
          <time datetime="${escapeHtml(post.createdDate)}">${escapeHtml(post.createdDate)}</time>
          <a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a>${summary}
        </article>`;
    })
    .join("\n");

  return documentShell({
    pageType: "time-sorted",
    title: "Time Sorted",
    body: `        <section id="time-sorted-posts">
${entries}
        </section>`,
  });
}

function generatedPagePaths(directory) {
  return path.join(generatedRoot, "src", "pages", ...directory.categoryPath, "index.html");
}

export async function writeGeneratedPages(model) {
  const inputs = {};

  await fs.rm(generatedRoot, { recursive: true, force: true });

  for (const directory of model.directories) {
    const filePath = generatedPagePaths(directory);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, renderCategoryPage(directory));
    inputs[`generated/${directory.key}/index`] = filePath;
  }

  const timeSortedPath = path.join(generatedRoot, "src", "pages", "time-sorted.html");

  await fs.mkdir(path.dirname(timeSortedPath), { recursive: true });
  await fs.writeFile(timeSortedPath, renderTimeSortedPage(model.posts));
  inputs["generated/time-sorted"] = timeSortedPath;

  return inputs;
}

async function moveIfPresent(source, destination) {
  try {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function promoteGeneratedPages(outDir, model) {
  const tempRoot = path.join(outDir, ".generated", "pages");

  for (const directory of model.directories) {
    const relativePath = path.join("src", "pages", ...directory.categoryPath, "index.html");

    await moveIfPresent(path.join(tempRoot, relativePath), path.join(outDir, relativePath));
  }

  await moveIfPresent(path.join(tempRoot, "src", "pages", "time-sorted.html"), path.join(outDir, "src", "pages", "time-sorted.html"));
  await fs.rm(path.join(outDir, ".generated"), { recursive: true, force: true });
}

export async function cleanupGeneratedPages() {
  await fs.rm(generatedRoot, { recursive: true, force: true });
}
