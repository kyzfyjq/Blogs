export function sortPages(pages, { filter, compareFn }) {
  return pages.filter(filter).toSorted(compareFn);
}

export function byCreatedDate(a, b) {
  return new Date(b.createdDate) - new Date(a.createdDate);
}

export function byTitle(a, b) {
  return a.title.localeCompare(b.title);
}

export function bySlug(a, b) {
  return a.slug.localeCompare(b.slug);
}

export function isPost(page) {
  return page.pageType === "post";
}
