export class Page {
    constructor({
        path,
        url = null,
        title,
        label = null,
        summary = null,
        releaseDate = null,
        lastModifiedDate = null,
        categories = [],
    }) {
        this.path = path;
        this.url = url;
        this.title = title;
        this.label = label;
        this.summary = summary;
        this.releaseDate = releaseDate;
        this.lastModifiedDate = lastModifiedDate;
        this.categories = categories;
    }

    isRootPage() {
        return this.categories.length === 0;
    }
}
