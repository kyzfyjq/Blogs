function setTreeItemOpen(item, open) {
  const toggle = item.querySelector(":scope > .site-tree-row > .site-tree-toggle");

  item.classList.toggle("is-open", open);
  toggle?.setAttribute("aria-expanded", String(open));
}

function setSidebarOpen(open) {
  const toggle = document.querySelector("#site-menu-toggle");

  document.body.classList.toggle("sidebar-open", open);
  toggle?.setAttribute("aria-expanded", String(open));
}

document.addEventListener("click", (event) => {
  const treeToggle = event.target.closest(".site-tree-toggle");

  if (treeToggle) {
    const item = treeToggle.closest(".site-tree-item");

    if (item) {
      setTreeItemOpen(item, !item.classList.contains("is-open"));
    }
    return;
  }

  if (event.target.closest("#site-menu-toggle")) {
    setSidebarOpen(!document.body.classList.contains("sidebar-open"));
    return;
  }

  if (event.target.closest("#sidebar-backdrop")) {
    setSidebarOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebarOpen(false);
  }
});
