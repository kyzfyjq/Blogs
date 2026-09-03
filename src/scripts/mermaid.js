import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
});

export async function renderMathGraphs() {
  const graphs = document.querySelectorAll("math-graph");

  if (graphs.length === 0) {
    return;
  }

  await mermaid.run({
    querySelector: "math-graph",
    suppressErrors: true,
  });
}
