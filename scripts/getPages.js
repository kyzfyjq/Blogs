import fs from "node:fs/promises";
import path from "node:path";

// Node.js Only
export async function getPages(pagesRootDir) {
    const entries = await fs.readdir(pagesRootDir, {
        withFileTypes: true,
    });
    const pages = [];

    for (const entry of entries) {
        const filePath = path.join(pagesRootDir, entry.name);

        if (entry.isDirectory()) {
            pages.push(...(await getPages(filePath)));
        } else if (
            entry.isFile() &&
            path.extname(entry.name).toLowerCase() === ".html"
        ) {
            pages.push(filePath);
        }
    }

    return pages;
}
