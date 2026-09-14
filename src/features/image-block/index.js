import "./style.css";

let viewer = null;
let viewerImage = null;
let closeButton = null;
let previouslyFocused = null;
let previousOverflow = "";

function closeViewer() {
  if (!viewer || viewer.hidden) {
    return;
  }

  viewer.hidden = true;
  viewerImage.removeAttribute("src");
  viewerImage.removeAttribute("alt");
  document.documentElement.style.overflow = previousOverflow;

  if (previouslyFocused?.isConnected) {
    previouslyFocused.focus();
  }

  previouslyFocused = null;
}

function ensureViewer() {
  if (viewer) {
    return;
  }

  viewer = document.createElement("div");
  viewer.className = "image-viewer";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Image viewer");

  viewerImage = document.createElement("img");
  viewerImage.className = "image-viewer-image";

  closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "image-viewer-close";
  closeButton.setAttribute("aria-label", "Close image viewer");
  closeButton.textContent = "×";

  viewer.append(closeButton, viewerImage);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });
  closeButton.addEventListener("click", closeViewer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeViewer();
    }
  });
  document.body.append(viewer);
}

function openViewer(image) {
  ensureViewer();

  previouslyFocused = document.activeElement;
  previousOverflow = document.documentElement.style.overflow;
  viewerImage.src = image.currentSrc || image.src;
  viewerImage.alt = image.alt ?? "";
  viewer.hidden = false;
  document.documentElement.style.overflow = "hidden";
  closeButton.focus();
}

export function activate({ content }) {
  const images = content?.querySelectorAll("image-block img") ?? [];

  for (const image of images) {
    if (image.dataset.imageBlockReady) {
      continue;
    }

    image.dataset.imageBlockReady = "true";
    image.addEventListener("click", () => openViewer(image));
  }
}
