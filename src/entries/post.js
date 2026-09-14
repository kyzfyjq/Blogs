import "../styles/base.css";
import "../styles/post.css";
import "../features/image-block/style.css";

import "../scripts/base.js";
import { activateFeatures } from "../core/featureRegistry.js";

await activateFeatures({
  document,
  content: document.querySelector("#content"),
  pageType: "post",
});
