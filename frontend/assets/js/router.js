// Minimal hash-based router.
//
// I declare routes as path patterns with `:param` segments. Matching
// params are forwarded to the renderer. Hash routing keeps GitHub
// Pages happy without server rewrites or 404 fallbacks.

const routes = [];

export const registerRoute = (pattern, render) => {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[^/]+/g, (m) => {
        keys.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ pattern, regex, keys, render });
};

const parseHash = () => {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryString = ""] = hash.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { path, query };
};

let activeRoute = null;
let viewEl = null;

export const navigate = (path) => {
  if (!path.startsWith("#")) path = `#${path}`;
  if (window.location.hash === path) {
    handleHashChange();
    return;
  }
  window.location.hash = path;
};

const renderNotFound = () => {
  return `<section class="section">
    <span class="eyebrow">404</span>
    <h1 class="h-display">Page not found</h1>
    <p class="lede">This route doesn't exist.</p>
    <p class="mt-2"><a class="btn" href="#/" data-link>Back to map</a></p>
  </section>`;
};

const updateActiveLinks = (path) => {
  document.querySelectorAll("[data-link]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const target = href.replace(/^#/, "");
    const isExact = target === path;
    const isPrefix =
      target !== "/" && target.length > 1 && path.startsWith(target);
    a.classList.toggle("active", isExact || isPrefix);
  });
};

const titleForPath = (path) => {
  if (path === "/") return "PostOil - GCC Map";
  if (path === "/overview") return "GCC Overview - PostOil";
  if (path === "/methodology") return "Methodology & Sources - PostOil";
  if (path.startsWith("/country/")) {
    const slug = path.split("/").pop() || "";
    const name = slug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
      .replace("United Arab Emirates", "United Arab Emirates");
    return `${name} - PostOil`;
  }
  return "PostOil - GCC Diversification Atlas";
};

export const handleHashChange = async () => {
  if (!viewEl) viewEl = document.getElementById("view");
  const { path, query } = parseHash();

  for (const r of routes) {
    const match = path.match(r.regex);
    if (match) {
      activeRoute = r;
      const params = Object.fromEntries(
        r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]),
      );
      viewEl.innerHTML = `<div class="loading">Loading…</div>`;
      try {
        const result = await r.render({ params, query });
        if (typeof result === "string") {
          viewEl.innerHTML = result;
        } else if (result && result.html) {
          viewEl.innerHTML = result.html;
          if (typeof result.onMount === "function") {
            // I wait one rAF so layout is computed before any chart
            // measures container widths through `clientWidth`.
            requestAnimationFrame(() => result.onMount(viewEl));
          }
        } else if (result == null) {
          // The render function already mutated the DOM directly.
        }
        document.title = titleForPath(path);
        viewEl.setAttribute("tabindex", "-1");
        viewEl.focus({ preventScroll: true });
      } catch (err) {
        console.error(err);
        viewEl.innerHTML = `<section class="section"><h1 class="h-section">Something went wrong</h1><p class="lede">${
          err && err.message ? err.message : err
        }</p></section>`;
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      updateActiveLinks(path);
      return;
    }
  }

  viewEl.innerHTML = renderNotFound();
  updateActiveLinks(path);
};

export const startRouter = () => {
  window.addEventListener("hashchange", handleHashChange);
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-link]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    if (window.location.hash === href) {
      event.preventDefault();
      handleHashChange();
    }
  });
  if (!window.location.hash) {
    window.location.hash = "#/";
  } else {
    handleHashChange();
  }
};
