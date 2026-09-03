import pagesDataJson from "../data/pagesData.json";
import { Page } from "../models/page.js";

const pagesData = pagesDataJson.map((pageData) => new Page(pageData));

// Navi bar
function createNaviLink(page) {
  const link = document.createElement("a");

  link.href = page.url;
  link.textContent = page.label;

  return link;
}

function getNaviBar() {
  let naviBar = document.querySelector("#navi-bar");
  if (naviBar) {
    return naviBar;
  }

  naviBar = document.createElement("nav");
  naviBar.id = "navi-bar";

  const layout = document.querySelector("#layout");
  if (layout) {
    layout.before(naviBar);
  } else {
    document.body.prepend(naviBar);
  }

  return naviBar;
}

function mountNaviBar() {
  const naviBar = getNaviBar();
  naviBar.replaceChildren();

  const naviPages = pagesData.filter((page) => page.isRootPage());

  for (const page of naviPages) {
    naviBar.append(createNaviLink(page));
  }
}

// Auto generate title
function mountPageTitle() {
  const metadata = document.querySelector('meta[name="title"]');

  if (metadata) {
    document.title = metadata.content;
  }
}

// Keep scroll position
window.history.scrollRestoration = "manual";

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

mountNaviBar();
mountPageTitle();
