export class Page {
  constructor({ path, url, slug, pageType, title, summary = null, createdDate = null, lastModifiedDate = null, categoryPath = [] }) {
    this.path = path;
    this.url = url;
    this.slug = slug;
    this.pageType = pageType;
    this.title = title;
    this.summary = summary;
    this.createdDate = createdDate;
    this.lastModifiedDate = lastModifiedDate;
    this.categoryPath = categoryPath;
  }

  isRootPage() {
    return this.categoryPath.length === 0;
  }

  isNavigationPage() {
    if (this.pageType === "home" || this.pageType === "time-sorted") {
      return true;
    }
    if (this.pageType === "category") {
      return this.categoryPath.length === 1;
    }
    return this.categoryPath.length === 0;
  }
}
