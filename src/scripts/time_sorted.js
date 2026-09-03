import pagesDataJson from "../data/pagesData.json";
import { Page } from "../models/page.js";
import { sortPages, byReleaseDate, isPost } from "../utils/pageSort.js";

const pagesDate = pagesDataJson.map((data) => new Page(data));

const sortedPages = sortPages(pagesDate, {
  filter: isPost,
  compareFn: byReleaseDate,
});

function createPageEntry(page) {
  const entry = document.createElement("article");

  const title = document.createElement("a");
  title.href = page.url;
  title.textContent = page.title;

  const date = document.createElement("time");
  date.dateTime = page.releaseDate;
  date.textContent = page.releaseDate;

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

  for (const page of sortedPages) {
    content.append(createPageEntry(page));
  }
}

mountTimeSorted();
