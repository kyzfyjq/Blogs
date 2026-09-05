import "./style.css";

import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
});

export async function activate() {
  await mermaid.run({
    querySelector: "math-graph",
    suppressErrors: true,
  });
}
