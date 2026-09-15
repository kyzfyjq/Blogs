import { load } from "cheerio";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import c from "shiki/langs/c.mjs";
import cpp from "shiki/langs/cpp.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import python from "shiki/langs/python.mjs";
import rust from "shiki/langs/rust.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import typescript from "shiki/langs/typescript.mjs";
import githubLight from "shiki/themes/github-light.mjs";
import { findCodeBlocks } from "./codeBlocks.js";

const LANGUAGE_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  html: "html",
  css: "css",
  sh: "shellscript",
  shell: "shellscript",
  bash: "shellscript",
  json: "json",
  py: "python",
  python: "python",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  rust: "rust",
};

const LANGUAGE_LABELS = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  shellscript: "Shell",
  json: "JSON",
  python: "Python",
  c: "C",
  cpp: "C++",
  rust: "Rust",
};

const CLASS_PATTERN = /class="([^"]*)"/i;
const LANGUAGE_CLASS_PATTERN = /(?:^|\s)language-([\w-]+)/i;

let highlighterPromise = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight],
      langs: [c, cpp, css, html, javascript, json, python, rust, shellscript, typescript],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }

  return highlighterPromise;
}

function decodeHtmlEntities(code) {
  return load(`<textarea>${code}</textarea>`)("textarea").text();
}

function normalizeCodeText(rawCode) {
  // Remove at most one structural newline/indent before the closing code tag.
  // Every other leading, internal, and trailing whitespace character is preserved.
  return decodeHtmlEntities(rawCode).replace(/\n[ \t]*$/, "");
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function removeBackgroundStyle(node) {
  node.properties.style = undefined;
}

async function renderCodeBlock(highlighter, { attributes, rawCode }) {
  const classMatch = attributes.match(CLASS_PATTERN);
  const languageMatch = classMatch?.[1].match(LANGUAGE_CLASS_PATTERN);
  const requestedLanguage = languageMatch?.[1]?.toLowerCase();
  const language = requestedLanguage ? LANGUAGE_ALIASES[requestedLanguage] : null;
  const code = normalizeCodeText(rawCode);
  let highlightedCode;

  if (language) {
    try {
      highlightedCode = highlighter.codeToHtml(code, {
        lang: language,
        theme: "github-light",
        transformers: [{ pre: removeBackgroundStyle }],
      });
    } catch {
      highlightedCode = `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  } else {
    highlightedCode = `<pre><code${attributes}>${escapeHtml(code)}</code></pre>`;
  }

  const label = language ? `<span class="code-block-language">${LANGUAGE_LABELS[language]}</span>` : "<span></span>";

  return `<div class="code-block">
  <div class="code-block-header">${label}<button class="code-block-copy" type="button">Copy</button></div>
  ${highlightedCode}
</div>`;
}

export async function highlightCodeBlocks(html) {
  const codeBlocks = findCodeBlocks(html);

  if (codeBlocks.length === 0) {
    return html;
  }

  const highlighter = await getHighlighter();
  let result = html;

  for (const codeBlock of codeBlocks.reverse()) {
    const { end, attributes, index, rawCode } = codeBlock;
    const replacement = await renderCodeBlock(highlighter, { attributes, rawCode });

    result = `${result.slice(0, index)}${replacement}${result.slice(end)}`;
  }

  return result;
}
