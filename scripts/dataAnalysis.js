import fs from "node:fs/promises";
import path from "node:path";

import { load } from "cheerio";

import { Page } from "../src/models/page.js";
import { getPages } from "./getPages.js";

const pageRootDir = "./src/pages";
const outputFile = "./src/data/pagesData.json";

// Node.js Only
export async function extractPage(filePath) {
    const html = await fs.readFile(filePath, "utf8");
    const $ = load(html);

    // HTML Metadata
    const title = $('meta[name="title"]').attr("content");
    const releaseDate = $('meta[name="releaseDate"]').attr("content");

    // File system metadata
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(pageRootDir, filePath);
    const directory = path.dirname(relativePath);
    const categories = directory === "." ? [] : directory.split(path.sep);

    return new Page({
        path: relativePath,
        title,
        releaseDate,
        lastModifiedDate: stats.mtime.toISOString(),
        categories,
    });
}

async function generatePagesData() {
    const Paths = await getPages(pageRootDir);
    const Datas = [];

    for (const Path of Paths) {
        const Data = await extractPage(Path);
        Datas.push(Data);
    }

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, JSON.stringify(Datas, null, 4));
}

generatePagesData();
