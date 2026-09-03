export function initMathBlocks() {
  const mathBlocks = document.querySelectorAll("math-block");

  for (const block of mathBlocks) {
    const type = block.classList[0];
    if (!type) {
      continue;
    }

    const title = block.querySelector(":scope > b");
    if (!title) {
      continue;
    }

    if (!title.textContent.trim()) {
      continue;
    }

    const name = type[0].toUpperCase() + type.slice(1);
    title.textContent = `${name} ${title.textContent}`;
  }
}
