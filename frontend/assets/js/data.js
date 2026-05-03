// Lightweight data loader with an in-memory cache.
//
// All JSON payloads ship with the static site under `./data/...`. The
// loader caches the fetch promise so navigating back and forth between
// pages does not trigger duplicate network requests.

const cache = new Map();

const fetchJson = async (path) => {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(path)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ${path}: ${res.status}`);
      }
      return res.json();
    })
    .catch((err) => {
      cache.delete(path);
      throw err;
    });
  cache.set(path, promise);
  return promise;
};

export const loadOverview = () => fetchJson("./data/gcc/overview.json");
export const loadComparisons = () => fetchJson("./data/gcc/comparisons.json");
export const loadCountry = (slug) =>
  fetchJson(`./data/countries/${slug}.json`);
export const loadGeo = () => fetchJson("./data/gcc.geo.json");
