import "./mathjax.js";
import { initMathBlocks } from "./math-block";
import { initTableOfContents } from "./toc";

initMathBlocks();
initTableOfContents();

if (document.querySelector("math-graph")) {
  const { renderMathGraphs } = await import("./mermaid.js");
  await renderMathGraphs();
}
