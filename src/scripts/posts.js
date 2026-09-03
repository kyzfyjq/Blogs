import "./mathjax.js";
import { initMathBlocks } from "./math-block";

initMathBlocks();

if (document.querySelector("math-graph")) {
  const { renderMathGraphs } = await import("./mermaid.js");
  await renderMathGraphs();
}
