export type ItemType = "movie" | "tv";
export type ItemCategory = "movie" | "series" | "anime";
export type ItemStatus = "later" | "watching" | "completed";

export interface Episode {
  episodeNumber: number;
  name: string;
  completed: boolean;
  airDate?: string;
}

export interface Season {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes: Episode[];
  isLoaded?: boolean;
}

export interface TrackedItem {
  id: string; // "movie_123" or "tv_123"
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  type: ItemType;
  category: ItemCategory;
  status: ItemStatus;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  overview?: string;
  runtime?: number; // in minutes
  rating?: number; // TMDB rating (0 - 10)
  genres?: string[];
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Progress tracking for series/anime
  currentSeason?: number;
  totalSeasons?: number;
  seasons?: Season[];
}

export type ThemeType = "oled-black" | "material" | "netflix" | "minimal";

export interface HistoryItem {
  itemId: string;
  title: string;
  type: ItemType;
  category: ItemCategory;
  completedAt: string;
  posterPath: string | null;
}

export interface Statistics {
  totalTitles: number;
  completedCount: number;
  remainingCount: number;
  completionRate: number;
  moviesCount: {
    total: number;
    completed: number;
  };
  seriesCount: {
    total: number;
    completed: number;
  };
  animeCount: {
    total: number;
    completed: number;
  };
  history: HistoryItem[];
}

export const getApiUrl = (path: string): string => {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const isLocalDevice = currentOrigin.includes("localhost") || 
                        currentOrigin.includes("127.0.0.1") || 
                        currentOrigin.includes("capacitor://") || 
                        currentOrigin.startsWith("http://localhost");
  
  if (isLocalDevice) {
    if (currentOrigin.includes(":3000")) {
      return path;
    }
    const savedServer = typeof localStorage !== "undefined" ? localStorage.getItem("last_known_server_url") : null;
    if (savedServer) {
      return `${savedServer}${path}`;
    }
  } else if (currentOrigin) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("last_known_server_url", currentOrigin);
    }
  }
  return path;
};

