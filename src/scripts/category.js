import pagesDataJson from "../data/pagesData.json";
import { Page } from "../models/page.js";
import { LISTING_IGNORE } from "../config/listingIgnore.js";
import { resolveSiteUrl } from "../config/site.js";
import { slugToDisplayName } from "../utils/displayName.js";
import { byCreatedDate, byTitle } from "../utils/pageSort.js";

const pages = pagesDataJson.map((data) => new Page(data));

function currentCategoryPath() {
  const current = pages.find((page) => {
    const pageUrl = new URL(page.url, window.location.origin).pathname;

    return pageUrl === window.location.pathname;
  });

  if (!current) {
    return [];
  }

  return current.categoryPath;
}

function hasPrefix(categoryPath, prefix) {
  return categoryPath.length >= prefix.length && prefix.every((segment, index) => categoryPath[index] === segment);
}

function childDirectorySlugs(categoryPath) {
  const slugs = new Set();

  for (const page of pages) {
    if (page.categoryPath.length > categoryPath.length && hasPrefix(page.categoryPath, categoryPath)) {
      slugs.add(page.categoryPath[categoryPath.length]);
    }
  }

  return [...slugs].sort();
}

function childDirectoryUrl(slug) {
  const path = [...currentCategoryPath(), slug, "index.html"].join("/");
  const categoryPage = pages.find((page) => page.path === path);

  return categoryPage?.url ?? resolveSiteUrl(`src/pages/${path}`);
}

function directPages(categoryPath) {
  const result = [];

  for (const page of pages) {
    const fileName = page.path.split("/").at(-1);

    if (page.categoryPath.length !== categoryPath.length || !hasPrefix(page.categoryPath, categoryPath)) {
      continue;
    }
    if (LISTING_IGNORE.files.has(fileName)) {
      continue;
    }

    result.push(page);
  }

  const dated = result.filter((page) => page.createdDate).sort((a, b) => byCreatedDate(a, b) || byTitle(a, b));
  const undated = result.filter((page) => !page.createdDate).sort(byTitle);

  return [...dated, ...undated];
}

function appendEntry(section, { href, label, date = null, isDirectory = false }) {
  const link = document.createElement("a");

  link.href = href;
  link.className = isDirectory ? "category-entry category-entry-directory" : "category-entry category-entry-page";

  if (date) {
    const time = document.createElement("time");

    time.dateTime = date;
    time.textContent = date;
    link.append(time);
  }

  const text = document.createElement("span");

  text.textContent = label;
  link.append(text);
  section.append(link);
}

function appendSection(container, headingText, entries) {
  if (entries.length === 0) {
    return;
  }

  const heading = document.createElement("h2");

  heading.textContent = headingText;
  container.append(heading);

  const section = document.createElement("div");

  section.className = "category-listing";

  for (const entry of entries) {
    appendEntry(section, entry);
  }

  container.append(section);
}

export function initCategoryListing() {
  const content = document.querySelector("#content");
  const children = document.querySelector("#children");

  if (!content || !children) {
    return;
  }

  const categoryPath = currentCategoryPath();

  children.replaceChildren();

  const directories = childDirectorySlugs(categoryPath).map((slug) => ({
    href: childDirectoryUrl(slug),
    label: slugToDisplayName(slug),
    isDirectory: true,
  }));
  const pageEntries = directPages(categoryPath).map((page) => ({
    href: page.url,
    label: page.title || slugToDisplayName(page.slug),
    date: page.createdDate,
  }));

  appendSection(children, "Categories", directories);
  appendSection(children, "Pages", pageEntries);
}

initCategoryListing();
