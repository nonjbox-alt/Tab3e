import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// TMDB API Setup
// Fallback to the user's provided API key if not set in environment
const TMDB_API_KEY = process.env.TMDB_API_KEY || "5e3f3156e27ac31165e5b8a3ad95bc82";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// PWA Manifest and Service Worker Endpoint serving
app.get("/manifest.json", (req, res) => {
  res.json({
    name: "WatchVault - قائمة تتبع المشاهدة",
    short_name: "WatchVault",
    description: "منصتك الشخصية لتتبع وإدارة المسلسلات والأفلام والأنمي بأسلوب PWA أنيق",
    start_url: "/",
    display: "standalone",
    background_color: "#020204",
    theme_color: "#020204",
    orientation: "portrait-primary",
    icons: [
      {
        src: "https://img.icons8.com/fluency/192/cinema.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "https://img.icons8.com/fluency/512/cinema.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  });
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('fetch', (event) => {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response("Offline");
        })
      );
    });
  `);
});

// TMDB Multi Search Proxy
app.get("/api/search", async (req, res) => {
  try {
    const { query, language = "ar" } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&language=${language}&include_adult=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error searching TMDB:", error.message);
    res.status(500).json({ error: error.message || "Failed to search TMDB" });
  }
});

// TMDB Trending Proxy
app.get("/api/trending", async (req, res) => {
  try {
    const { language = "ar", page = "1" } = req.query;
    const url = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=${language}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching trending TMDB:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch trending" });
  }
});

// TMDB Detail Proxy
app.get("/api/details", async (req, res) => {
  try {
    const { id, type, language = "ar" } = req.query;
    if (!id || !type) {
      return res.status(400).json({ error: "id and type parameters are required" });
    }

    if (type !== "movie" && type !== "tv") {
      return res.status(400).json({ error: "type must be 'movie' or 'tv'" });
    }

    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=${language}&append_to_response=credits,images,videos,recommendations`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching details TMDB:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch details" });
  }
});

// TMDB TV Season Proxy
app.get("/api/season", async (req, res) => {
  try {
    const { id, season, language = "ar" } = req.query;
    if (!id || season === undefined) {
      return res.status(400).json({ error: "id and season parameters are required" });
    }

    const url = `${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}&language=${language}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching season TMDB:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch season details" });
  }
});

// Vite Middleware for Asset Serving & Production Static Serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
