export const SITE_BASE = "/Blogs/";

export function resolveSiteUrl(pathname = "") {
  if (!pathname || pathname === "/") {
    return SITE_BASE;
  }

  return `${SITE_BASE}${String(pathname).replace(/^\/+/, "")}`;
}

export function pageUrl(relativePath) {
  return resolveSiteUrl(`src/pages/${relativePath}`);
}

export function categoryUrl(categoryPath) {
  const segments = Array.isArray(categoryPath) ? categoryPath : String(categoryPath).split("/").filter(Boolean);

  if (segments.length === 0) {
    return SITE_BASE;
  }

  return `${resolveSiteUrl(`src/pages/${segments.join("/")}`).replace(/\/+$/, "")}/`;
}
