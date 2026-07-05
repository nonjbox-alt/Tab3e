import { getApiUrl } from "../types";

const DEFAULT_KEY = "5e3f3156e27ac31165e5b8a3ad95bc82";

export const getTmdbKey = (): string => {
  if (typeof localStorage !== "undefined") {
    const custom = localStorage.getItem("wv_tmdb_api_key");
    if (custom && custom.trim() !== "") {
      return custom.trim();
    }
  }
  return DEFAULT_KEY;
};

// Check if we are running in a static environment like Vercel, netlify, surges, github-pages, etc.
export const isStaticEnvironment = (): boolean => {
  if (typeof window === "undefined") return false;
  const origin = window.location.origin;
  return (
    origin.includes("vercel.app") || 
    origin.includes("github.io") || 
    origin.includes("surge.sh") || 
    origin.includes("netlify.app") ||
    origin.includes("capacitor://") ||
    (!origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("run.app") && !origin.includes("3000"))
  );
};

export interface TmdbFetchOptions {
  apiPath: string; // e.g. "/api/search?query=..."
  directUrlCreator: (key: string) => string; // e.g. (key) => `https://api.themoviedb.org/3/search/multi?api_key=${key}...`
}

export const fetchTmdb = async (options: TmdbFetchOptions): Promise<any> => {
  const isStatic = isStaticEnvironment();
  const customKey = typeof localStorage !== "undefined" ? localStorage.getItem("wv_tmdb_api_key") : null;
  const hasCustomKey = customKey && customKey.trim() !== "";

  // 1. If we are running in a static environment (like Vercel) OR the user provided their own custom key,
  // we can attempt a direct client-side call to TMDB! This ensures:
  // - Vercel hosting works flawlessly
  // - Custom keys bypass backend limits/cache instantly
  if (isStatic || hasCustomKey) {
    const activeKey = hasCustomKey ? customKey.trim() : DEFAULT_KEY;
    const directUrl = options.directUrlCreator(activeKey);
    try {
      const response = await fetch(directUrl);
      if (response.ok) {
        return await response.json();
      }
      console.warn(`Direct TMDB fetch failed with status ${response.status}. Falling back to proxy.`);
    } catch (err) {
      console.warn("Direct TMDB fetch failed due to network error. Falling back to proxy:", err);
    }
  }

  // 2. Fetch via the Express proxy backend
  const proxyUrl = getApiUrl(options.apiPath);
  const headers: Record<string, string> = {};
  if (hasCustomKey) {
    headers["X-TMDB-API-KEY"] = customKey.trim();
  }

  try {
    const response = await fetch(proxyUrl, { headers });
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Proxy fetch failed with status ${response.status}. Trying fallback.`);
  } catch (err) {
    console.warn("Proxy fetch failed due to network error. Trying fallback:", err);
  }

  // 3. Ultimate Fallback: Direct call to TMDB API on the client with default key
  try {
    const fallbackUrl = options.directUrlCreator(DEFAULT_KEY);
    const fallbackResponse = await fetch(fallbackUrl);
    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }
  } catch (e) {
    console.error("Direct fallback TMDB fetch failed as well:", e);
  }

  throw new Error("Failed to fetch TMDB data from both proxy and direct servers.");
};
