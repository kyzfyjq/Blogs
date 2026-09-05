import fs from "node:fs/promises";
import path from "node:path";

import { getPageTypeConfig } from "../src/core/pageTypes.js";
import { slugToDisplayName } from "../src/utils/displayName.js";

const pagesRoot = path.resolve("src/pages");
const segmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SUPPORTED_TYPES = new Set(["post", "page", "category"]);

function usage() {
  return `Usage:
  pnpm new <type> <path>
  pnpm new --check [--fix]

Types: post, page, category
Example:
  pnpm new post mathematics/analysis/compactness`;
}

function currentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseTarget(rawTarget) {
  if (!rawTarget || rawTarget.startsWith("/") || rawTarget.includes("\\") || rawTarget.split("/").includes("..")) {
    throw new Error(`Invalid path "${rawTarget}": use safe relative kebab-case paths`);
  }

  const segments = rawTarget.split("/");

  for (const segment of segments) {
    if (!segmentPattern.test(segment)) {
      throw new Error(`Invalid path segment "${segment}": use kebab-case (lowercase letters, digits, hyphens)`);
    }
  }

  return segments;
}

function assertSafeResolved(targetPath) {
  const resolved = path.resolve(pagesRoot, targetPath);

  if (resolved !== pagesRoot && !resolved.startsWith(`${pagesRoot}${path.sep}`)) {
    throw new Error(`Path escapes page root: ${targetPath}`);
  }

  return resolved;
}

function documentShell({ pageType, title = "", summary = null, createdDate = null, bodyContent }) {
  const metas = [`    <meta charset="UTF-8" />`, `    <meta name="page-type" content="${pageType}" />`];

  metas.push(`    <meta name="title" content="${title}" />`);
  if (summary !== null) {
    metas.push(`    <meta name="summary" content="${summary}" />`);
  }
  if (createdDate !== null) {
    metas.push(`    <meta name="createdDate" content="${createdDate}" />`);
  }

  return [
    "<!doctype html>",
    "<html>",
    "  <head>",
    ...metas,
    "  </head>",
    "  <body>",
    '    <div id="layout">',
    '      <div id="content">',
    ...bodyContent,
    "      </div>",
    "    </div>",
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}

function postTemplate() {
  return documentShell({
    pageType: "post",
    title: "",
    summary: "",
    createdDate: currentDate(),
    bodyContent: ["        <header>", "          <h1></h1>", "        </header>"],
  });
}

function pageTemplate() {
  return documentShell({
    pageType: "page",
    title: "",
    bodyContent: ["        <header>", "          <h1></h1>", "        </header>"],
  });
}

function categoryTemplate(displayName) {
  return documentShell({
    pageType: "category",
    title: displayName,
    bodyContent: [
      "        <header>",
      `          <h1>${displayName}</h1>`,
      "        </header>",
      '        <section id="introduction"></section>',
      '        <section id="children"></section>',
    ],
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createPage(type, rawTarget) {
  if (!SUPPORTED_TYPES.has(type)) {
    throw new Error(`Unsupported type "${type}"\n\n${usage()}`);
  }

  parseTarget(rawTarget);
  const filePath = path.resolve(pagesRoot, `${rawTarget}.html`);

  assertSafeResolved(`${rawTarget}.html`);

  if (await fileExists(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${path.relative(process.cwd(), filePath)}`);
  }

  const html = type === "post" ? postTemplate() : pageTemplate();

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html);
  console.log(`Created ${path.relative(process.cwd(), filePath)}`);
}

async function createCategory(rawTarget) {
  const segments = parseTarget(rawTarget);
  const directory = path.resolve(pagesRoot, rawTarget);

  assertSafeResolved(rawTarget);

  const indexPath = path.join(directory, "index.html");

  if (await fileExists(indexPath)) {
    throw new Error(`Refusing to overwrite existing category index: ${path.relative(process.cwd(), indexPath)}`);
  }

  const slug = segments.at(-1);
  const html = categoryTemplate(slugToDisplayName(slug));

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(indexPath, html);
  console.log(`Created ${path.relative(process.cwd(), indexPath)}`);
}

async function listDirectories(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(root, entry.name);

    result.push({ name: entry.name, path: entryPath, relativePath: path.relative(pagesRoot, entryPath) });
    result.push(...(await listDirectories(entryPath)));
  }

  return result;
}

async function listHtmlFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      result.push(...(await listHtmlFiles(entryPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      result.push(entryPath);
    }
  }

  return result;
}

function readMeta(content, name) {
  return content.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"))?.[1] ?? null;
}

async function checkConsistency({ fix = false } = {}) {
  const directories = await listDirectories(pagesRoot);
  const htmlFiles = await listHtmlFiles(pagesRoot);
  const issues = [];
  const createdIndexes = [];

  const indexPaths = new Set(htmlFiles.map((filePath) => filePath.toLowerCase()));
  const missingIndexDirectories = directories.filter((directory) => !indexPaths.has(path.join(directory.path, "index.html").toLowerCase()));

  if (fix) {
    for (const directory of missingIndexDirectories) {
      const relativePath = path.relative(pagesRoot, directory.path);
      const slug = relativePath.split(path.sep).at(-1);
      const indexPath = path.join(directory.path, "index.html");

      await fs.writeFile(indexPath, categoryTemplate(slugToDisplayName(slug)));
      createdIndexes.push(path.relative(process.cwd(), indexPath));
    }
  } else {
    for (const directory of missingIndexDirectories) {
      issues.push(`missing category index: ${directory.relativePath}/index.html`);
    }
  }

  for (const directory of directories) {
    if (!segmentPattern.test(directory.name)) {
      issues.push(`non-kebab-case directory: ${path.relative(pagesRoot, directory.path)}`);
    }
  }

  const homeHtml = await fs.readFile(path.resolve("index.html"), "utf8");
  const homeType = readMeta(homeHtml, "page-type");

  if (homeType !== "home") {
    issues.push("index.html must declare page-type=home");
  }

  for (const filePath of htmlFiles) {
    const relativePath = path.relative(pagesRoot, filePath);
    const html = await fs.readFile(filePath, "utf8");
    const pageType = readMeta(html, "page-type");
    const fileName = path.basename(filePath);
    const slug = fileName.replace(/\.html$/i, "");

    if (!pageType) {
      issues.push(`missing page-type: ${relativePath}`);
      continue;
    }
    if (!getPageTypeConfig(pageType)) {
      issues.push(`unknown page-type "${pageType}": ${relativePath}`);
      continue;
    }
    if (!segmentPattern.test(slug)) {
      issues.push(`non-kebab-case page slug: ${relativePath}`);
    }

    if (fileName.toLowerCase() === "index.html" && pageType !== "category") {
      issues.push(`category index must declare page-type=category: ${relativePath}`);
    }
    if (pageType === "category" && fileName.toLowerCase() !== "index.html") {
      issues.push(`category pages must be named index.html: ${relativePath}`);
    }
    if (pageType === "category" && !readMeta(html, "title")) {
      issues.push(`category index missing title: ${relativePath}`);
    }
    if (pageType === "post" && !readMeta(html, "createdDate")) {
      issues.push(`post missing createdDate: ${relativePath}`);
    }
  }

  const message =
    issues.length > 0 ? `Found ${issues.length} issue(s):\n${issues.map((issue) => `  - ${issue}`).join("\n")}` : "No consistency issues found.";

  console.log(message);

  if (createdIndexes.length > 0) {
    console.log(
      `\nCreated category indexes:\n\n${createdIndexes.map((filePath) => `  ${filePath}`).join("\n")}\n\nPlease write introductions for these category pages.`,
    );
  }

  return issues.length === 0 && createdIndexes.length >= 0;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--check")) {
    const fix = args.includes("--fix");
    const ok = await checkConsistency({ fix });

    process.exitCode = ok ? 0 : 1;
    return;
  }

  const [type, target] = args;

  if (!type || !target || args.length !== 2) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  if (type === "category") {
    await createCategory(target);
  } else {
    await createPage(type, target);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
