export const PAGE_TYPES = {
  home: {
    entry: "/src/entries/home.js",
  },

  post: {
    entry: "/src/entries/post.js",
  },

  category: {
    entry: "/src/entries/category.js",
  },

  "time-sorted": {
    entry: "/src/entries/time-sorted.js",
  },

  page: {
    entry: "/src/entries/page.js",
  },
};

export const GENERATED_PAGE_TYPES = new Set(["category", "time-sorted"]);

export function getPageTypeConfig(pageType) {
  return PAGE_TYPES[pageType] ?? null;
}
