export class Page {
    constructor({
        path,
        title,
        releaseDate = null,
        lastModifiedDate = null,
        categories = [],
    }) {
        this.path = path;
        this.title = title;
        this.releaseDate = releaseDate;
        this.lastModifiedDate = lastModifiedDate;
        this.categories = categories;
    }

    get url() {
        return `/src/pages/${this.path}`;
    }

    isRootPage() {
        return this.categories.length === 0;
    }
}
