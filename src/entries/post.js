// Page layout and structural feature CSS are eager; interactive feature JS stays lazy.
import "../styles/base.css";
import "../styles/post.css";
import "../features/code-block/style.css";
import "../features/image-block/style.css";
import "../features/math-block/style.css";
import "../features/math-graph/style.css";
import "../features/toc/style.css";

import "../scripts/base.js";
import { activateFeatures } from "../core/featureRegistry.js";

await activateFeatures({
  document,
  content: document.querySelector("#content"),
  pageType: "post",
});
