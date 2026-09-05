import "./style.css";

function slugify(text) {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function ensureHeadingId(heading, usedIds) {
  if (heading.id) {
    usedIds.add(heading.id);
    return;
  }

  const base = slugify(heading.textContent);
  let id = base;

  for (let suffix = 2; usedIds.has(id); suffix++) {
    id = `${base}-${suffix}`;
  }

  heading.id = id;
  usedIds.add(id);
}

export function activate({ content }) {
  if (!content || document.getElementById("toc")) {
    return;
  }

  const headings = [...content.querySelectorAll("h2, h3, h4, h5, h6")];

  if (headings.length === 0) {
    return;
  }

  const usedIds = new Set(["toc", ...[...document.querySelectorAll("[id]")].map((element) => element.id)]);
  const toc = document.createElement("aside");

  toc.id = "toc";

  for (const heading of headings) {
    ensureHeadingId(heading, usedIds);

    const link = document.createElement("a");

    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    link.dataset.level = heading.tagName.slice(1);

    toc.append(link);
  }

  document.body.append(toc);
}
