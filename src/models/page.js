export class Page {
    constructor({
        path,
        url = null,
        title,
        label = null,
        releaseDate = null,
        lastModifiedDate = null,
        categories = [],
    }) {
        this.path = path;
        this.url = url;
        this.title = title;
        this.label = label;
        this.releaseDate = releaseDate;
        this.lastModifiedDate = lastModifiedDate;
        this.categories = categories;
    }

    isRootPage() {
        return this.categories.length === 0;
    }
}
