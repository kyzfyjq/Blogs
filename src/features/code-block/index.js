function copyCode(button, code) {
  if (!navigator.clipboard?.writeText) {
    return;
  }

  navigator.clipboard
    .writeText(code)
    .then(() => {
      const originalText = button.textContent;

      button.textContent = "Copied";
      button.classList.add("is-copied");

      window.setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("is-copied");
      }, 1200);
    })
    .catch(() => {});
}

export function activate({ content }) {
  const buttons = content?.querySelectorAll(".code-block-copy") ?? [];

  for (const button of buttons) {
    if (button.dataset.codeBlockReady) {
      continue;
    }

    button.dataset.codeBlockReady = "true";
    button.addEventListener("click", () => {
      const code = button.closest(".code-block")?.querySelector("code")?.textContent ?? "";

      copyCode(button, code);
    });
  }
}
