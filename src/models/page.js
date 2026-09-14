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
}
