export function sortPages(pages, { filter, compareFn }) {
    return pages.filter(filter).toSorted(compareFn);
}

export function byReleaseDate(a, b) {
    return new Date(b.releaseDate) - new Date(a.releaseDate);
}
export function isPost(page) {
    return page.releaseDate != null;
}
