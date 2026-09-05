import { load } from "cheerio";

export const MATHJAX_SOURCE_URL = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js";
export const MATHJAX_CONFIG = `window.MathJax = {
  tex: {
    inlineMath: [["\\\\(", "\\\\)"]],
    displayMath: [["\\\\[", "\\\\]"]],
  },
};`;

const EXCLUDED_SELECTOR = "script, style, code, pre, math-graph, svg, math";
const TEX_DELIMITER = /\\\(|\\\[/;

export function htmlHasTex(html) {
  const $ = load(html);

  $(EXCLUDED_SELECTOR).remove();

  return TEX_DELIMITER.test($("body").text());
}
