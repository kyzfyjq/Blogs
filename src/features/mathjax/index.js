export function activate() {
  window.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
    },
  };

  const script = document.createElement("script");

  script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js";
  script.defer = true;

  document.head.appendChild(script);
}
