// Canonical authored form: place <!-- prettier-ignore --> immediately before <pre><code>.
const CODE_BLOCK_PATTERN = /<pre(?:\s[^>]*)?>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;

export function findCodeBlocks(html) {
  const pattern = new RegExp(CODE_BLOCK_PATTERN.source, CODE_BLOCK_PATTERN.flags);
  const blocks = [];

  for (const match of html.matchAll(pattern)) {
    blocks.push({
      index: match.index,
      end: match.index + match[0].length,
      fullMatch: match[0],
      attributes: match[1],
      rawCode: match[2],
    });
  }

  return blocks;
}

export function hasPrettierIgnore(html, codeBlockIndex) {
  return /<!--\s*prettier-ignore\s*-->\s*$/.test(html.slice(0, codeBlockIndex));
}
