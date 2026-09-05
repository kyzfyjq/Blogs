import pagesDataJson from "../data/pagesData.json";
import { Page } from "../models/page.js";
import { sortPages, byCreatedDate, isPost } from "../utils/pageSort.js";

const pages = pagesDataJson.map((data) => new Page(data));
const sortedPosts = sortPages(pages, {
  filter: isPost,
  compareFn: (a, b) => byCreatedDate(a, b) || a.slug.localeCompare(b.slug),
});

function createPageEntry(page) {
  const entry = document.createElement("article");

  const title = document.createElement("a");
  title.href = page.url;
  title.textContent = page.title;

  const date = document.createElement("time");
  date.dateTime = page.createdDate;
  date.textContent = page.createdDate;

  entry.append(date, title);

  if (page.summary) {
    const summary = document.createElement("p");
    summary.textContent = page.summary;
    entry.append(summary);
  }

  return entry;
}

function mountTimeSorted() {
  const content = document.querySelector("#content");

  if (!content) {
    return;
  }

  for (const page of sortedPosts) {
    content.append(createPageEntry(page));
  }
}

mountTimeSorted();
