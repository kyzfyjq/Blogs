import "./style.css";

export function activate() {
  const mathBlocks = document.querySelectorAll("math-block");

  for (const block of mathBlocks) {
    const type = block.classList[0];

    if (!type) {
      continue;
    }

    let title = block.querySelector(":scope > b");

    if (!title) {
      title = document.createElement("b");
      block.prepend(title);
    }

    const name = type[0].toUpperCase() + type.slice(1);
    const content = title.textContent.trim();

    title.textContent = content ? `${name} ${content}` : name;
  }
}
