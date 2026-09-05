const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "MATH-GRAPH", "SVG", "MATH"]);
const TEX_DELIMITER = /\\(?:\(|\[)/;

function nodeHasTex(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return TEX_DELIMITER.test(node.data);
  }
  if (node.nodeType !== Node.ELEMENT_NODE || SKIPPED_TAGS.has(node.tagName)) {
    return false;
  }

  for (const child of node.childNodes) {
    if (nodeHasTex(child)) {
      return true;
    }
  }

  return false;
}

export function contentHasTex(content) {
  if (!content) {
    return false;
  }

  for (const child of content.childNodes) {
    if (nodeHasTex(child)) {
      return true;
    }
  }

  return false;
}
