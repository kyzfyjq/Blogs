import { Feature } from "./feature.js";

export const FEATURES = [
  new Feature({
    name: "math-block",

    detect({ content }) {
      return content?.querySelector("math-block") !== null;
    },

    load() {
      return import("../features/math-block/index.js");
    },
  }),

  new Feature({
    name: "toc",

    detect({ content }) {
      return content?.querySelector("h2") !== null;
    },

    load() {
      return import("../features/toc/index.js");
    },
  }),

  new Feature({
    name: "math-graph",

    detect({ content }) {
      return content?.querySelector("math-graph") !== null;
    },

    load() {
      return import("../features/math-graph/index.js");
    },
  }),
];

export function detectActiveFeatures(context) {
  return FEATURES.filter((feature) => feature.detect(context));
}

export async function activateFeatures(context) {
  const activeFeatures = detectActiveFeatures(context);

  await Promise.all(activeFeatures.map((feature) => feature.activate(context)));
}
