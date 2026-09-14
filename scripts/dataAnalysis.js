import fs from "node:fs/promises";
import path from "node:path";

import { buildSiteModel } from "./site.js";

const outputFile = "./src/data/pagesData.json";

async function generatePagesData() {
  const model = await buildSiteModel();
  const pagesData = [model.home, model.timeSorted, ...model.categoryPages, ...model.pages];

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(pagesData, null, 4));
}

generatePagesData();
