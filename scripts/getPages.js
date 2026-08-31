import fs from "node:fs/promises";
import path from "node:path";

// Node.js Only
export async function getPages(pagesRootDir) {
    const entries = await fs.readdir(pagesRootDir, {
        withFileTypes: true,
    });
    const pages = [];

    for (const entry of entries) {
        const Path = path.join(pagesRootDir, entry.name);

        if (entry.isDirectory()) {
            pages.push(...(await getPages(Path)));
        } else if (
            entry.isFile() &&
            path.extname(entry.name).toLowerCase() === ".html"
        ) {
            pages.push(Path);
        }
    }

    return pages;
}
