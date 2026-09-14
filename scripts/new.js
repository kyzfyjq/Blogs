import fs from "node:fs/promises";
import path from "node:path";

import { GENERATED_PAGE_TYPES, getPageTypeConfig } from "../src/core/pageTypes.js";

const pagesRoot = path.resolve("src/pages");
const segmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const SUPPORTED_TYPES = new Set(["post", "page"]);

function usage() {
  return `Usage:
  pnpm new <type> <path>
  pnpm new --check [--fix]

Types: post, page
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
  const target = rawTarget?.replace(/\/+$/, "");

  if (!target || target.startsWith("/") || target.includes("\\") || target.split("/").includes("..")) {
    throw new Error(`Invalid path "${rawTarget}": use safe relative kebab-case paths`);
  }

  const segments = target.split("/");

  for (const segment of segments) {
    if (!segmentPattern.test(segment)) {
      throw new Error(`Invalid path segment "${segment}": use kebab-case (lowercase letters, digits, hyphens)`);
    }
  }

  return { segments, target };
}

function assertSafeResolved(targetPath) {
  const resolved = path.resolve(pagesRoot, targetPath);

  if (resolved !== pagesRoot && !resolved.startsWith(`${pagesRoot}${path.sep}`)) {
    throw new Error(`Path escapes page root: ${targetPath}`);
  }

  return resolved;
}

function documentShell({ pageType, title = "", summary = null, createdDate = null }) {
  const metas = [
    `    <meta charset="UTF-8" />`,
    `    <meta name="page-type" content="${pageType}" />`,
    `    <meta name="title" content="${title}" />`,
  ];

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
    "        <header>",
    "          <h1></h1>",
    "        </header>",
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
  });
}

function pageTemplate() {
  return documentShell({
    pageType: "page",
    title: "",
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

  const { target } = parseTarget(rawTarget);
  const filePath = path.resolve(pagesRoot, `${target}.html`);

  assertSafeResolved(`${target}.html`);

  if (await fileExists(filePath)) {
    throw new Error(`Refusing to overwrite existing file: ${path.relative(process.cwd(), filePath)}`);
  }

  const html = type === "post" ? postTemplate() : pageTemplate();

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html);
  console.log(`Created ${path.relative(process.cwd(), filePath)}`);
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

async function checkConsistency() {
  const directories = await listDirectories(pagesRoot);
  const htmlFiles = await listHtmlFiles(pagesRoot);
  const issues = [];

  for (const directory of directories) {
    if (!segmentPattern.test(directory.name)) {
      issues.push(`non-kebab-case directory: ${path.relative(pagesRoot, directory.path)}`);
    }
  }

  const homeHtml = await fs.readFile(path.resolve("index.html"), "utf8");

  if (readMeta(homeHtml, "page-type") !== "home") {
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
    if (GENERATED_PAGE_TYPES.has(pageType)) {
      issues.push(`generated page-type "${pageType}" must not be authored: ${relativePath}`);
      continue;
    }
    if (fileName.toLowerCase() === "index.html") {
      issues.push(`obsolete authored category index: ${relativePath}`);
      continue;
    }
    if (!segmentPattern.test(slug)) {
      issues.push(`non-kebab-case page slug: ${relativePath}`);
    }
    if (pageType === "post") {
      const createdDate = readMeta(html, "createdDate");

      if (!createdDate) {
        issues.push(`post missing createdDate: ${relativePath}`);
      } else if (!datePattern.test(createdDate)) {
        issues.push(`post has invalid createdDate "${createdDate}": ${relativePath}`);
      }
    }
  }

  const message =
    issues.length > 0 ? `Found ${issues.length} issue(s):\n${issues.map((issue) => `  - ${issue}`).join("\n")}` : "No consistency issues found.";

  console.log(message);

  return issues.length === 0;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--check")) {
    if (args.includes("--fix")) {
      console.log("No automatic fixes are available for filesystem categories.");
    }

    const ok = await checkConsistency();

    process.exitCode = ok ? 0 : 1;
    return;
  }

  const [type, target] = args;

  if (!type || !target || args.length !== 2) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  await createPage(type, target);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
