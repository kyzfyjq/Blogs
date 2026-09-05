export const DISPLAY_NAME_ALIASES = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  csapp: "CSAPP",
};

export function slugToDisplayName(slug) {
  if (DISPLAY_NAME_ALIASES[slug] !== undefined) {
    return DISPLAY_NAME_ALIASES[slug];
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
