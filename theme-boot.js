(function bootTheme() {
  "use strict";

  const fallback = globalThis.BiliFocus
    ? globalThis.BiliFocus.DEFAULT_APPEARANCE.theme
    : "noir";

  if (!globalThis.BiliFocus) {
    document.documentElement.dataset.theme = fallback;
    return;
  }

  let cached = "";
  try {
    cached = localStorage.getItem("bf-theme") || "";
  } catch (_error) {
    cached = "";
  }

  // localStorage only paints the first frame. popup.js replaces it with
  // chrome.storage.local.appearance as soon as getData() succeeds; never treat
  // this cached value as the authority.
  BiliFocus.applyTheme(document.documentElement, cached || fallback, { colorScheme: true });
})();
