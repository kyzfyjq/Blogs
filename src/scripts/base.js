import Data from "../data/pagesData.json";
import { Page } from "../models/page.js";

const pagesData = Data.map((pageData) => new Page(pageData));

// Navi bar
function createNaviLink(page) {
    const link = document.createElement("a");

    link.href = page.url;
    link.textContent = page.title;

    return link;
}

function mountNaviBar() {
    const naviBar = document.querySelector("#navi-bar");

    if (!naviBar) {
        return;
    }

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

mountNaviBar();
mountPageTitle();
