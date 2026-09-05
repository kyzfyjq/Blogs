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
