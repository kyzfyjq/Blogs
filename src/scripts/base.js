import "./sidebar.js";

function mountPageTitle() {
  const metadata = document.querySelector('meta[name="title"]');

  if (metadata) {
    document.title = metadata.content;
  }
}

window.history.scrollRestoration = "manual";

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

mountPageTitle();
