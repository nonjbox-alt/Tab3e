import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search as SearchIcon, 
  Play, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  FileDown, 
  FileUp, 
  Star, 
  Compass, 
  Sliders, 
  Home, 
  PlaySquare, 
  Heart, 
  Flame, 
  Grid, 
  List, 
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  X,
  Tv,
  Copy
} from "lucide-react";
import { TrackedItem, ThemeType, Statistics, ItemCategory, Season, Episode } from "./types";
import { getInitialTrackedItems } from "./initialData";
import { Navigation } from "./components/Navigation";
import { TrackedCard } from "./components/TrackedCard";
import { StatsHeatMap } from "./components/StatsHeatMap";
import { ItemDetailsModal } from "./components/ItemDetailsModal";

interface ManualAddInlineFormProps {
  onAdd: (title: string, category: ItemCategory) => void;
  theme: ThemeType;
}

const ManualAddInlineForm: React.FC<ManualAddInlineFormProps> = ({ onAdd, theme }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("series");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), category);
    setTitle("");
  };

  const getFormBg = () => {
    if (theme === "minimal") return "bg-white border-neutral-200 text-neutral-950 shadow-sm";
    if (theme === "netflix") return "bg-[#110f0c] border-amber-950/20 text-amber-100";
    if (theme === "material") return "bg-[#18181c] border-zinc-900/60 text-zinc-100";
    return "bg-[#0b0b0e] border border-neutral-900/60 text-neutral-100"; // OLED Black
  };

  const getInputClass = () => {
    if (theme === "minimal") return "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-400";
    if (theme === "netflix") return "bg-neutral-950 border-neutral-900/40 text-amber-100 focus:border-amber-900/30";
    if (theme === "material") return "bg-zinc-950 border-zinc-900/40 text-zinc-100 focus:border-zinc-800";
    return "bg-neutral-950 border-neutral-900/60 text-neutral-200 focus:border-neutral-700";
  };

  const getSubmitButtonClass = () => {
    if (theme === "minimal") return "bg-neutral-950 hover:bg-neutral-900 text-white";
    if (theme === "netflix") return "bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold";
    if (theme === "material") return "bg-zinc-100 hover:bg-white text-zinc-950";
    return "bg-neutral-100 hover:bg-neutral-200 text-neutral-950";
  };

  const getButtonActiveStyle = (active: boolean) => {
    if (active) {
      if (theme === "minimal") return "bg-neutral-900 text-white font-bold shadow-sm";
      if (theme === "netflix") return "bg-amber-400 text-neutral-950 font-bold";
      if (theme === "material") return "bg-zinc-200 text-zinc-950 font-bold";
      return "bg-white text-black font-bold";
    }
    if (theme === "minimal") return "text-neutral-400 hover:text-neutral-600";
    return "text-neutral-500 hover:text-neutral-300";
  };

  return (
    <div className={`rounded-2xl p-4 md:p-5 mt-6 select-none text-right border transition-all duration-300 ${getFormBg()}`}>
      <div className="flex items-center gap-2 mb-3 justify-start" dir="rtl">
        <Plus className="w-4 h-4 text-neutral-400" />
        <h3 className="font-bold text-xs md:text-sm">إضافة عمل مخصص يدوي تحت القائمة</h3>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3" dir="rtl">
        <input
          type="text"
          placeholder="أدخل اسم الفيلم أو المسلسل هنا..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full text-xs rounded-xl px-4 py-3 focus:outline-none border transition-colors ${getInputClass()}`}
        />
        <div className="flex items-center w-full sm:w-auto gap-2 shrink-0">
          <div className={`flex rounded-xl p-1 border w-full sm:w-auto ${theme === "minimal" ? "bg-neutral-50 border-neutral-200" : "bg-neutral-950 border-neutral-900/40"}`}>
            <button
              type="button"
              onClick={() => setCategory("series")}
              className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${getButtonActiveStyle(category === "series")}`}
            >
              مسلسل
            </button>
            <button
              type="button"
              onClick={() => setCategory("movie")}
              className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all ${getButtonActiveStyle(category === "movie")}`}
            >
              فيلم
            </button>
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            className={`disabled:opacity-50 text-[10px] md:text-xs font-bold py-2.5 px-4 rounded-xl transition-all h-full shrink-0 flex items-center justify-center gap-1 w-full sm:w-auto ${getSubmitButtonClass()}`}
          >
            <span>إضافة عمل</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default function App() {
  // 1. Core States
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [theme, setTheme] = useState<ThemeType>("oled-black");
  const [activeTab, setActiveTab] = useState<string>("home");
  
  // Library filters
  const [libraryFilter, setLibraryFilter] = useState<string>("all");
  const [posterWallMode, setPosterWallMode] = useState<boolean>(false);
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(" "); // Space triggers all list, search matches
  
  // Online / Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingOnline, setSearchingOnline] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string>("");
  
  // Immersive modal active item
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  
  // Heat map completion history state { "YYYY-MM-DD": count }
  const [activityHistory, setActivityHistory] = useState<{ [key: string]: number }>({});

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // File input ref for backup
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File input ref for TV Time import
  const tvTimeInputRef = useRef<HTMLInputElement>(null);

  // 2. Load Local Storage on startup
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem("wv_theme") as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Force-clear once on startup for a clean slate requested by the user
    const hasClearedForFresh = localStorage.getItem("wv_fresh_cleared_v3");
    if (!hasClearedForFresh) {
      localStorage.setItem("wv_items", "[]");
      localStorage.setItem("wv_activity", "{}");
      localStorage.setItem("wv_fresh_cleared_v3", "true");
      setTrackedItems([]);
      setActivityHistory({});
    } else {
      // Load tracked items
      const savedItems = localStorage.getItem("wv_items");
      if (savedItems) {
        try {
          const parsed = JSON.parse(savedItems) as TrackedItem[];
          setTrackedItems(parsed);
        } catch (e) {
          console.error("Error loading saved items");
          setTrackedItems([]);
        }
      } else {
        setTrackedItems([]);
        localStorage.setItem("wv_items", "[]");
      }

      // Load activity history
      const savedHistory = localStorage.getItem("wv_activity");
      if (savedHistory) {
        try {
          setActivityHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Error loading activity history");
        }
      } else {
        setActivityHistory({});
        localStorage.setItem("wv_activity", "{}");
      }
    }
  }, []);

  // Save items on changes
  const saveTrackedItems = (items: TrackedItem[]) => {
    setTrackedItems(items);
    localStorage.setItem("wv_items", JSON.stringify(items));
  };

  // Save activity on changes
  const saveActivityHistory = (history: { [key: string]: number }) => {
    setActivityHistory(history);
    localStorage.setItem("wv_activity", JSON.stringify(history));
  };

  // 3. Toast Helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 4. TMDB Search logic
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchFeedback("");
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performOnlineSearch(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performOnlineSearch = async (query: string) => {
    setSearchingOnline(true);
    setSearchFeedback("جاري البحث عن العناوين المذهلة...");
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&language=ar`);
      if (!response.ok) {
        throw new Error("فشل جلب نتائج البحث من TMDB");
      }
      const data = await response.json();
      const results = data.results || [];
      
      // Filter out people and unneeded content types
      const filteredResults = results.filter((item: any) => item.media_type === "movie" || item.media_type === "tv");
      setSearchResults(filteredResults);
      if (filteredResults.length === 0) {
        setSearchFeedback("لم نعثر على نتائج مطابقة في قاعدة البيانات.");
      } else {
        setSearchFeedback("");
      }
    } catch (error: any) {
      console.error("Error performing search:", error);
      setSearchFeedback("أنت تبحث في وضع عدم الاتصال حالياً. يمكنك تتبع الأعمال من مكتبتك المحلية.");
      setSearchResults([]);
    } finally {
      setSearchingOnline(false);
    }
  };

  // 5. Add custom title manually (Offline fallback)
  const handleAddManualItem = (title: string, category: ItemCategory) => {
    if (!title.trim()) return;

    const newItem: TrackedItem = {
      id: `manual_${Date.now()}`,
      title: title.trim(),
      type: category === "movie" ? "movie" : "tv",
      category,
      status: "later",
      posterPath: null,
      backdropPath: null,
      favorite: false,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (category !== "movie") {
      newItem.totalSeasons = 1;
      newItem.currentSeason = 1;
      newItem.seasons = [
        {
          seasonNumber: 1,
          name: "الموسم 1",
          episodeCount: 10,
          episodes: Array.from({ length: 10 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: false,
          })),
        },
      ];
    }

    const updated = [newItem, ...trackedItems];
    saveTrackedItems(updated);
    showToast("تمت إضافة العمل بنجاح لمكتبتك كـ مهمة مشاهدة جديدة!");
  };

  // 6. Quick add TMDB result to Library
  const handleAddTmdbItem = async (tmdbItem: any) => {
    // Check if already in library
    const exists = trackedItems.find(
      (item) => item.tmdbId === tmdbItem.id && item.type === tmdbItem.media_type
    );
    if (exists) {
      showToast("هذا العمل مضاف بالفعل في مكتبتك!", "error");
      return;
    }

    showToast("جاري تهيئة العمل وحفظه...");

    try {
      // Fetch full details to get total seasons and backdrop
      const detailsResp = await fetch(`/api/details?id=${tmdbItem.id}&type=${tmdbItem.media_type}&language=ar`);
      if (!detailsResp.ok) throw new Error("Details fetch failed");
      const details = await detailsResp.json();

      const category: ItemCategory = 
        tmdbItem.media_type === "tv"
          ? (details.genres?.some((g: any) => g.name === "أنمي" || g.name === "Animation") ? "anime" : "series")
          : "movie";

      const newItem: TrackedItem = {
        id: `${tmdbItem.media_type}_${tmdbItem.id}`,
        tmdbId: tmdbItem.id,
        title: tmdbItem.title || tmdbItem.name || "عنوان غير معروف",
        originalTitle: tmdbItem.original_title || tmdbItem.original_name,
        type: tmdbItem.media_type,
        category,
        status: "later",
        posterPath: tmdbItem.poster_path,
        backdropPath: tmdbItem.backdrop_path || tmdbItem.poster_path,
        releaseDate: tmdbItem.release_date || tmdbItem.first_air_date,
        overview: tmdbItem.overview || details.overview || "",
        runtime: details.runtime || (details.episode_run_time ? details.episode_run_time[0] : undefined),
        rating: tmdbItem.vote_average,
        genres: details.genres?.map((g: any) => g.name) || [],
        favorite: false,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (tmdbItem.media_type === "tv") {
        newItem.totalSeasons = details.number_of_seasons || 1;
        newItem.currentSeason = 1;
        // Generate blank initial seasons, we'll lazily load them when opened!
        newItem.seasons = Array.from({ length: newItem.totalSeasons }, (_, i) => ({
          seasonNumber: i + 1,
          name: `الموسم ${i + 1}`,
          episodeCount: 10, // Default estimate, overwritten upon TMDB detail loading
          episodes: [],
          isLoaded: false,
        }));
      }

      const updated = [newItem, ...trackedItems];
      saveTrackedItems(updated);
      showToast("تم حفظ العمل بنجاح في مكتبتك الشخصية!");
    } catch (e) {
      // Fallback if detail fetch fails
      const category: ItemCategory = tmdbItem.media_type === "tv" ? "series" : "movie";
      const newItem: TrackedItem = {
        id: `${tmdbItem.media_type}_${tmdbItem.id}`,
        tmdbId: tmdbItem.id,
        title: tmdbItem.title || tmdbItem.name || "عنوان غير معروف",
        originalTitle: tmdbItem.original_title || tmdbItem.original_name,
        type: tmdbItem.media_type,
        category,
        status: "later",
        posterPath: tmdbItem.poster_path,
        backdropPath: tmdbItem.backdrop_path || tmdbItem.poster_path,
        releaseDate: tmdbItem.release_date || tmdbItem.first_air_date,
        overview: tmdbItem.overview || "",
        rating: tmdbItem.vote_average,
        favorite: false,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (tmdbItem.media_type === "tv") {
        newItem.totalSeasons = 1;
        newItem.currentSeason = 1;
        newItem.seasons = [
          {
            seasonNumber: 1,
            name: "الموسم 1",
            episodeCount: 10,
            episodes: Array.from({ length: 10 }, (_, i) => ({
              episodeNumber: i + 1,
              name: `الحلقة ${i + 1}`,
              completed: false,
            })),
          },
        ];
      }

      const updated = [newItem, ...trackedItems];
      saveTrackedItems(updated);
      showToast("تم الحفظ السريع للعمل بنجاح في مكتبتك!");
    }
  };

  // 7. General item updator & Completion trigger
  const handleUpdateItem = (updatedItem: TrackedItem) => {
    // Check if status changed to completed to log activity
    const previous = trackedItems.find((i) => i.id === updatedItem.id);
    const completedJustNow = updatedItem.status === "completed" && previous?.status !== "completed";
    
    // Log daily activity for both item completions AND episode checkmarks
    let activityLogUpdated = false;
    const history = { ...activityHistory };
    const todayStr = new Date().toISOString().split("T")[0];

    if (completedJustNow) {
      history[todayStr] = (history[todayStr] || 0) + 1;
      activityLogUpdated = true;
    } else if (updatedItem.seasons && previous?.seasons) {
      // Compare checked episodes count
      let prevChecked = 0;
      let currChecked = 0;
      
      previous.seasons.forEach((s) => s.episodes?.forEach((ep) => { if (ep.completed) prevChecked++; }));
      updatedItem.seasons.forEach((s) => s.episodes?.forEach((ep) => { if (ep.completed) currChecked++; }));

      if (currChecked > prevChecked) {
        history[todayStr] = (history[todayStr] || 0) + (currChecked - prevChecked);
        activityLogUpdated = true;
      }
    }

    if (activityLogUpdated) {
      saveActivityHistory(history);
    }

    const updated = trackedItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    saveTrackedItems(updated);
    
    if (selectedItem?.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = trackedItems.filter((item) => item.id !== id);
    saveTrackedItems(updated);
    showToast("تمت إزالة العمل والمهمات التابعة له بالكامل.");
  };

  // 8. Statistics Calculation
  const getStatistics = (): Statistics => {
    const total = trackedItems.length;
    const completed = trackedItems.filter((i) => i.status === "completed").length;
    const remaining = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const movies = trackedItems.filter((i) => i.category === "movie");
    const series = trackedItems.filter((i) => i.category === "series");
    const anime = trackedItems.filter((i) => i.category === "anime");

    // History items sorted by completedAt
    const historyItems = trackedItems
      .filter((i) => i.status === "completed" && i.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .map((i) => ({
        itemId: i.id,
        title: i.title,
        type: i.type,
        category: i.category,
        completedAt: i.completedAt!,
        posterPath: i.posterPath,
      }));

    return {
      totalTitles: total,
      completedCount: completed,
      remainingCount: remaining,
      completionRate: rate,
      moviesCount: {
        total: movies.length,
        completed: movies.filter((i) => i.status === "completed").length,
      },
      seriesCount: {
        total: series.length,
        completed: series.filter((i) => i.status === "completed").length,
      },
      animeCount: {
        total: anime.length,
        completed: anime.filter((i) => i.status === "completed").length,
      },
      history: historyItems,
    };
  };

  const stats = getStatistics();

  // 9. Finding Resume Target (Last active show being watched with remaining episodes)
  const getResumeTarget = (): { item: TrackedItem; nextEpisode: number; seasonNum: number } | null => {
    // Find watched items still in "watching" state
    const watchingShows = trackedItems
      .filter((i) => i.type === "tv" && i.status === "watching" && i.seasons && i.seasons.length > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (watchingShows.length === 0) return null;

    // Find the next uncompleted episode in the active/current season
    for (const show of watchingShows) {
      const activeSeasonNum = show.currentSeason || 1;
      const seasonObj = show.seasons!.find((s) => s.seasonNumber === activeSeasonNum);
      
      if (seasonObj && seasonObj.episodes && seasonObj.episodes.length > 0) {
        const nextEp = seasonObj.episodes.find((ep) => !ep.completed);
        if (nextEp) {
          return {
            item: show,
            nextEpisode: nextEp.episodeNumber,
            seasonNum: activeSeasonNum,
          };
        }
      }
    }

    return null;
  };

  const resumeTarget = getResumeTarget();

  // Quick action: checkmark next episode for Resume
  const handleQuickMarkEpisode = (targetItem: TrackedItem, seasonNum: number, episodeNum: number) => {
    if (!targetItem.seasons) return;

    const updatedSeasons = targetItem.seasons.map((s) => {
      if (s.seasonNumber === seasonNum && s.episodes) {
        const updatedEpisodes = s.episodes.map((ep) => {
          if (ep.episodeNumber <= episodeNum) {
            return { ...ep, completed: true };
          }
          return ep;
        });
        return { ...s, episodes: updatedEpisodes };
      }
      return s;
    });

    const allCompleted = updatedSeasons.every((s) =>
      s.episodes && s.episodes.length > 0 && s.episodes.every((ep) => ep.completed)
    );

    const updatedItem: TrackedItem = {
      ...targetItem,
      seasons: updatedSeasons,
      status: allCompleted ? "completed" : "watching",
      completedAt: allCompleted ? new Date().toISOString() : targetItem.completedAt,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateItem(updatedItem);
    showToast(`تم إكمال الحلقة ${episodeNum} بنجاح! طاقة مذهلة لحياتك.`);
  };

  // 10. Backup & Reset Systems
  const handleExportBackup = () => {
    const backupData = {
      trackedItems,
      theme,
      activityHistory,
      version: "1.0.0",
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `WatchVault_Backup_${new Date().toISOString().split("T")[0]}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    showToast("تم تصدير نسخة احتياطية من مكتبتك بنجاح!");
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        
        if (parsed && Array.isArray(parsed.trackedItems)) {
          saveTrackedItems(parsed.trackedItems);
          if (parsed.theme) {
            setTheme(parsed.theme);
            localStorage.setItem("wv_theme", parsed.theme);
          }
          if (parsed.activityHistory) {
            saveActivityHistory(parsed.activityHistory);
          }
          showToast("تم استيراد النسخة الاحتياطية وتحديث بياناتك بالكامل بنجاح!");
        } else {
          showToast("صيغة الملف غير صالحة. تأكد أنه ملف WatchVault صحيح.", "error");
        }
      } catch (err) {
        showToast("فشل في قراءة ملف النسخة الاحتياطية.", "error");
      }
    };
    fileReader.readAsText(file);
  };

  const handleCopyBackupToClipboard = () => {
    try {
      const backupData = {
        trackedItems,
        theme,
        activityHistory,
        version: "1.0.0",
        exportDate: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      navigator.clipboard.writeText(jsonStr);
      showToast("تم نسخ ملف النسخ الاحتياطي إلى الحافظة بنجاح!");
    } catch (err) {
      console.error(err);
      showToast("فشل في نسخ الاحتياطي إلى الحافظة.", "error");
    }
  };

  const handleImportTVTime = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Read all selected files as text
    const fileList = Array.from(files);
    
    try {
      const readFilesData = await Promise.all(
        fileList.map((file: any) => {
          return new Promise<{ name: string; content: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({ name: file.name, content: e.target?.result as string });
            };
            reader.onerror = () => reject(new Error(`فشل قراءة ${file.name}`));
            reader.readAsText(file);
          });
        })
      );

      // Temporary collections for show mapping and movie lists
      const showsMap: { [id: string]: { id: string; name: string; episodes: { season: number; episode: number }[] } } = {};
      const moviesList: { id: string; name: string }[] = [];

      // Clean CSV Parser
      const parseCSVRows = (text: string): string[][] => {
        const rows: string[][] = [];
        let row: string[] = [""];
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              row[row.length - 1] += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            row.push("");
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            rows.push(row);
            row = [""];
          } else {
            row[row.length - 1] += char;
          }
        }
        if (row.length > 1 || row[0] !== "") {
          rows.push(row);
        }
        return rows;
      };

      // Process JSON files first (TV Time Liberator export format)
      for (const file of readFilesData) {
        if (file.name.endsWith(".json")) {
          try {
            const parsed = JSON.parse(file.content);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any, index: number) => {
                const isTv = "seenEpisodes" in item || "seasons" in item || item.type === "tv" || "tvshow_id" in item || "tv_show_id" in item;
                if (isTv) {
                  const showId = String(item.id || item.tvshow_id || item.tv_show_id || `jtv_${index}_${Date.now()}`);
                  const showName = item.name || item.title || "مسلسل غير معروف";
                  const episodes: { season: number; episode: number }[] = [];

                  if (Array.isArray(item.seenEpisodes)) {
                    item.seenEpisodes.forEach((ep: any) => {
                      episodes.push({
                        season: Number(ep.season || ep.seasonNumber || 1),
                        episode: Number(ep.episode || ep.episodeNumber || 1)
                      });
                    });
                  } else if (Array.isArray(item.seasons)) {
                    item.seasons.forEach((season: any) => {
                      const sNum = Number(season.number || season.seasonNumber || 1);
                      if (Array.isArray(season.episodes)) {
                        season.episodes.forEach((ep: any) => {
                          if (ep.seen || ep.completed || ep.watched) {
                            episodes.push({
                              season: sNum,
                              episode: Number(ep.number || ep.episodeNumber || 1)
                            });
                          }
                        });
                      }
                    });
                  }

                  showsMap[showId] = {
                    id: showId,
                    name: showName,
                    episodes: [...(showsMap[showId]?.episodes || []), ...episodes]
                  };
                } else {
                  const mName = item.name || item.title;
                  if (mName) {
                    moviesList.push({
                      id: String(item.id || `jmv_${index}_${Date.now()}`),
                      name: mName
                    });
                  }
                }
              });
            } else if (parsed && typeof parsed === "object") {
              if (Array.isArray(parsed.shows)) {
                parsed.shows.forEach((item: any, index: number) => {
                  const showId = String(item.id || item.tv_show_id || `jtv_${index}_${Date.now()}`);
                  const showName = item.name || item.title || "مسلسل غير معروف";
                  const episodes: { season: number; episode: number }[] = [];
                  if (Array.isArray(item.seen_episodes)) {
                    item.seen_episodes.forEach((ep: any) => {
                      episodes.push({ season: Number(ep.season || 1), episode: Number(ep.episode || 1) });
                    });
                  }
                  showsMap[showId] = { id: showId, name: showName, episodes };
                });
              }
              if (Array.isArray(parsed.movies)) {
                parsed.movies.forEach((item: any, index: number) => {
                  const mName = item.name || item.title;
                  if (mName) {
                    moviesList.push({
                      id: String(item.id || `jmv_${index}_${Date.now()}`),
                      name: mName
                    });
                  }
                });
              }
            }
          } catch (e) {
            console.error("Error parsing TV Time Liberator JSON:", e);
          }
        }
      }

      // Process CSV files (official TV Time GDPR export files)
      for (const file of readFilesData) {
        if (file.name.endsWith(".csv")) {
          const rows = parseCSVRows(file.content);
          if (rows.length < 2) continue;

          const headers = rows[0].map(h => h.trim().toLowerCase());
          const isFollowedShows = headers.includes("tv_show_id") || headers.includes("tv_show_name") || file.name.toLowerCase().includes("show");
          const isFollowedMovies = headers.includes("movie_id") || headers.includes("movie_name") || file.name.toLowerCase().includes("movie");
          const isSeenEpisodes = headers.includes("episode_number") || file.name.toLowerCase().includes("episode");

          if (isSeenEpisodes) {
            const showIdIdx = headers.findIndex(h => h.includes("show_id") || h.includes("tv_show_id"));
            const seasonIdx = headers.findIndex(h => h.includes("season"));
            const episodeIdx = headers.findIndex(h => h.includes("episode"));

            if (showIdIdx !== -1 && seasonIdx !== -1 && episodeIdx !== -1) {
              for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (row.length < 3) continue;
                const showId = row[showIdIdx]?.trim();
                const season = Number(row[seasonIdx]?.trim() || 1);
                const epNum = Number(row[episodeIdx]?.trim() || 1);

                if (showId) {
                  if (!showsMap[showId]) {
                    showsMap[showId] = { id: showId, name: `مسلسل TV Time #${showId}`, episodes: [] };
                  }
                  showsMap[showId].episodes.push({ season, episode: epNum });
                }
              }
            }
          } else if (isFollowedShows) {
            const showIdIdx = headers.findIndex(h => h.includes("show_id") || h.includes("tv_show_id") || h === "id");
            const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("title"));

            if (showIdIdx !== -1 && nameIdx !== -1) {
              for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (row.length < 2) continue;
                const showId = row[showIdIdx]?.trim();
                const showName = row[nameIdx]?.trim();

                if (showId && showName) {
                  if (!showsMap[showId]) {
                    showsMap[showId] = { id: showId, name: showName, episodes: [] };
                  } else {
                    showsMap[showId].name = showName;
                  }
                }
              }
            }
          } else if (isFollowedMovies) {
            const movieIdIdx = headers.findIndex(h => h.includes("movie_id") || h === "id");
            const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("title"));

            if (movieIdIdx !== -1 && nameIdx !== -1) {
              for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (row.length < 2) continue;
                const mId = row[movieIdIdx]?.trim();
                const mName = row[nameIdx]?.trim();

                if (mId && mName) {
                  moviesList.push({ id: mId, name: mName });
                }
              }
            }
          }
        }
      }

      // Convert maps into clean TrackedItems
      const importedItems: TrackedItem[] = [];
      const nowISO = new Date().toISOString();

      // Convert TV shows
      Object.values(showsMap).forEach((show, index) => {
        const episodesBySeason: { [seasonNum: number]: number[] } = {};
        show.episodes.forEach(ep => {
          if (!episodesBySeason[ep.season]) {
            episodesBySeason[ep.season] = [];
          }
          if (!episodesBySeason[ep.season].includes(ep.episode)) {
            episodesBySeason[ep.season].push(ep.episode);
          }
        });

        const totalSeasons = Object.keys(episodesBySeason).length > 0
          ? Math.max(...Object.keys(episodesBySeason).map(Number))
          : 1;

        const seasonsData: Season[] = [];
        for (let s = 1; s <= totalSeasons; s++) {
          const completedEpNumbers = episodesBySeason[s] || [];
          const maxEpNum = completedEpNumbers.length > 0 ? Math.max(...completedEpNumbers) : 10;
          const totalEpsInSeason = Math.max(10, maxEpNum);

          const epsList: Episode[] = Array.from({ length: totalEpsInSeason }, (_, i) => {
            const epNum = i + 1;
            const completed = completedEpNumbers.includes(epNum);
            return {
              episodeNumber: epNum,
              name: `الحلقة ${epNum}`,
              completed,
            };
          });

          seasonsData.push({
            seasonNumber: s,
            name: `الموسم ${s}`,
            episodeCount: totalEpsInSeason,
            episodes: epsList,
            isLoaded: true
          });
        }

        const allCompleted = seasonsData.every(s => s.episodes?.every(ep => ep.completed));

        importedItems.push({
          id: `tvtime_tv_${show.id}_${index}_${Date.now()}`,
          title: show.name,
          type: "tv",
          category: "series",
          status: allCompleted ? "completed" : "watching",
          posterPath: null,
          backdropPath: null,
          favorite: false,
          addedAt: nowISO,
          updatedAt: nowISO,
          totalSeasons,
          currentSeason: 1,
          seasons: seasonsData,
          completedAt: allCompleted ? nowISO : undefined
        });
      });

      // Convert Movies
      moviesList.forEach((movie, index) => {
        importedItems.push({
          id: `tvtime_movie_${movie.id}_${index}_${Date.now()}`,
          title: movie.name,
          type: "movie",
          category: "movie",
          status: "completed",
          posterPath: null,
          backdropPath: null,
          favorite: false,
          addedAt: nowISO,
          updatedAt: nowISO,
          completedAt: nowISO
        });
      });

      if (importedItems.length === 0) {
        showToast("لم نتمكن من قراءة أي أعمال صالحة في الملفات المرفوعة.", "error");
        return;
      }

      // Filter out duplicates
      const existingTitles = new Set(trackedItems.map((i) => i.title.toLowerCase()));
      const filteredNewItems = importedItems.filter((i) => !existingTitles.has(i.title.toLowerCase()));

      const merged = [...trackedItems, ...filteredNewItems];
      saveTrackedItems(merged);

      // Log into activity history
      const history = { ...activityHistory };
      filteredNewItems.forEach(item => {
        if (item.status === "completed" && item.completedAt) {
          const dateStr = item.completedAt.split("T")[0];
          history[dateStr] = (history[dateStr] || 0) + 1;
        } else if (item.seasons) {
          let checkedCount = 0;
          item.seasons.forEach(s => s.episodes?.forEach(ep => { if (ep.completed) checkedCount++; }));
          if (checkedCount > 0) {
            const dateStr = item.addedAt.split("T")[0];
            history[dateStr] = (history[dateStr] || 0) + checkedCount;
          }
        }
      });
      saveActivityHistory(history);

      showToast(`تم استيراد ${filteredNewItems.length} عمل من مكتبة TV Time بنجاح ومزامنة الحلقات!`);
    } catch (e) {
      console.error(e);
      showToast("فشل معالجة ملفات TV Time. يرجى التأكد من صحة الملفات.", "error");
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleResetApp = () => {
    if (confirm("تحذير: سيتم حذف جميع المسلسلات والأفلام وسجل تقدمك بالكامل. هل تريد الاستمرار؟")) {
      localStorage.clear();
      setTrackedItems([]);
      setActivityHistory({});
      setTheme("oled-black");
      showToast("تم مسح جميع البيانات بنجاح.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Theme-specific CSS mappings
  const getThemeBackground = () => {
    if (theme === "minimal") return "bg-[#f8f9fa] text-neutral-900";
    if (theme === "netflix") return "bg-[#0c0a08] text-amber-50";
    if (theme === "material") return "bg-[#121214] text-zinc-100";
    return "bg-[#020204] text-neutral-100"; // OLED Black
  };

  const getThemeSectionClass = () => {
    if (theme === "minimal") return "bg-white border-neutral-200/80 text-neutral-950 shadow-sm";
    if (theme === "netflix") return "bg-[#110f0c] border-amber-950/15 text-amber-100";
    if (theme === "material") return "bg-[#18181c] border-zinc-900/50 text-zinc-100";
    return "bg-[#0b0b0e] border-neutral-900/60 text-neutral-100"; // OLED Black
  };

  const getThemeHeadingClass = () => {
    if (theme === "minimal") return "text-neutral-900";
    if (theme === "netflix") return "text-amber-100";
    if (theme === "material") return "text-zinc-100";
    return "text-white";
  };

  const getThemeHeadingTextClass = () => {
    if (theme === "minimal") return "text-neutral-950";
    if (theme === "netflix") return "text-amber-200";
    if (theme === "material") return "text-zinc-100";
    return "text-white";
  };

  const getThemeSubtextClass = () => {
    if (theme === "minimal") return "text-neutral-500";
    if (theme === "netflix") return "text-amber-400/80";
    if (theme === "material") return "text-zinc-400";
    return "text-neutral-400";
  };

  const getThemeInputClass = () => {
    if (theme === "minimal") return "bg-white border-neutral-200 text-neutral-900 focus:border-neutral-400 focus:bg-white";
    if (theme === "netflix") return "bg-neutral-950/80 border-amber-950/30 text-amber-100 focus:border-amber-700/50";
    if (theme === "material") return "bg-zinc-900/60 border-zinc-800 text-zinc-100 focus:border-zinc-700";
    return "bg-[#0a0a0d] border border-neutral-900/60 text-neutral-200 focus:border-neutral-700";
  };

  const getThemeButtonClass = () => {
    if (theme === "minimal") return "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-200/60";
    if (theme === "netflix") return "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-950/30";
    if (theme === "material") return "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800";
    return "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800";
  };

  const getThemeAccentClass = () => {
    if (theme === "netflix") return "text-amber-400 hover:text-amber-300";
    if (theme === "material") return "text-teal-400 hover:text-teal-300";
    if (theme === "minimal") return "text-neutral-900 hover:text-neutral-700";
    return "text-white";
  };

  // Format Completed Date
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "أمس";
    if (diffDays === 2) return "منذ يومين";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 14) return "الأسبوع الماضي";
    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  };

  return (
    <div className={`min-h-screen ${getThemeBackground()} transition-colors duration-500 flex flex-col md:pr-64 pb-20 md:pb-6`} dir="rtl">
      {/* Toast notifications wrapper */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-4 right-4 md:left-auto md:right-8 z-50 md:w-80 p-4 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-neutral-900/90 text-white border-neutral-800" 
                : "bg-red-950/90 text-red-200 border-red-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8 md:gap-10">
        
        {/* Navigation Sidebar & Bottom Nav */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} title="WatchVault" />

        {/* ==================== HOME TAB ==================== */}
        {activeTab === "home" && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            {/* Minimal Header */}
            <header className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 ${getThemeHeadingClass()}`}>
                  <span>WatchVault</span>
                  <span className={`text-[10px] py-0.5 px-2 rounded-full font-mono border ${
                    theme === "minimal" 
                      ? "bg-neutral-100 border-neutral-200 text-neutral-600" 
                      : "bg-neutral-900 border-neutral-800 text-neutral-500"
                  }`}>PWA</span>
                </h2>
                <p className={`text-xs mt-0.5 ${getThemeSubtextClass()}`}>مرحباً بك في مستودع المشاهدة الخاص بك. كل عمل هو مهمة تستحق الإنجاز.</p>
              </div>
              <button 
                onClick={() => setActiveTab("search")}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${getThemeButtonClass()}`}
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            </header>

            {/* Smart CONTINUE WATCHING (Resume) */}
            {resumeTarget ? (
              <section className="flex flex-col gap-3">
                <h3 className={`font-bold text-xs md:text-sm flex items-center gap-1.5 uppercase tracking-wider ${getThemeSubtextClass()}`}>
                  <Play className="w-3.5 h-3.5" />
                  <span>متابعة المشاهدة</span>
                </h3>
                
                {/* Stunning Premium Backdrop card */}
                <div 
                  className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[160px] md:min-h-[220px] bg-neutral-950 border border-neutral-900 flex flex-col justify-end p-5 md:p-6 shadow-2xl group cursor-pointer"
                  onClick={() => setSelectedItem(resumeTarget.item)}
                >
                  {/* Backdrop Background image */}
                  <img
                    src={
                      resumeTarget.item.backdropPath
                        ? resumeTarget.item.backdropPath.startsWith("http")
                          ? resumeTarget.item.backdropPath
                          : `https://image.tmdb.org/t/p/w1280${resumeTarget.item.backdropPath}`
                        : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop"
                    }
                    alt={resumeTarget.item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  {/* Backdrop Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Info details overlay */}
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1 md:gap-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold bg-white/10 backdrop-blur-md border border-white/5 py-0.5 px-2 rounded-full w-max">
                        {resumeTarget.item.category === "anime" ? "أنمي" : "مسلسل تلفزيوني"}
                      </span>
                      <h4 className="text-sm md:text-xl font-bold text-white leading-tight">
                        {resumeTarget.item.title.split("|")[0].trim()}
                      </h4>
                      <p className="text-xs text-neutral-300 font-medium">
                        الموسم {resumeTarget.seasonNum} • الحلقة {resumeTarget.nextEpisode}
                      </p>
                    </div>

                    {/* Checkmark Episode completed in 1-click */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent modal opening
                        handleQuickMarkEpisode(
                          resumeTarget.item,
                          resumeTarget.seasonNum,
                          resumeTarget.nextEpisode
                        );
                      }}
                      className="shrink-0 bg-white hover:bg-neutral-200 text-neutral-950 text-[10px] md:text-xs font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 active:scale-98"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-950" />
                      <span>تعليم كـ تم مشاهدتها</span>
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {/* LIBRARY PROGRESS & CELEBRATION */}
            <section className={`rounded-2xl p-5 md:p-6 shadow-md border flex flex-col gap-4 transition-all duration-300 ${getThemeSectionClass()}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5 ${getThemeSubtextClass()}`}>
                    <Plus className="w-4 h-4" />
                    <span>تقدم المكتبة الإجمالي</span>
                  </h3>
                  <p className={`text-xs mt-1 ${getThemeSubtextClass()}`}>معدل تصفية وإكمال مهمات المشاهدة في مكتبتك</p>
                </div>
                <div className="text-left">
                  <span className={`text-base md:text-2xl font-black font-mono ${getThemeHeadingTextClass()}`}>{stats.completionRate}%</span>
                </div>
              </div>

              {/* Real high quality progress bar */}
              <div className={`w-full h-3 rounded-full overflow-hidden border ${
                theme === "minimal" ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-900/30"
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    theme === "minimal" 
                      ? "bg-neutral-900" 
                      : theme === "netflix" 
                        ? "bg-amber-400" 
                        : theme === "material" 
                          ? "bg-teal-400" 
                          : "bg-white"
                  }`}
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>

              {stats.completionRate === 100 && stats.totalTitles > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 border p-3.5 rounded-xl mt-1 ${
                    theme === "minimal"
                      ? "bg-neutral-50 border-neutral-200 text-neutral-800"
                      : "bg-white/[0.02] border-neutral-800 text-white"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">إنجاز تاريخي! لقد أنهيت جميع الأعمال الموجودة في مكتبتك.</h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${getThemeSubtextClass()}`}>
                      لا يوجد شيء متبقي للتتبع. لقد قمت بإنجاز رائع وحافظت على تركيزك! نقترح عليك العثور على أعمال رائعة جديدة وإضافتها للمشاهدة لاحقاً.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className={`flex items-center gap-6 text-[11px] font-medium ${getThemeSubtextClass()}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${theme === "minimal" ? "bg-neutral-600" : "bg-white"}`}></span>
                    <span>{stats.totalTitles} عمل إجمالي</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{stats.completedCount} مكتمل بالكامل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-600"></span>
                    <span>{stats.remainingCount} قيد المتابعة</span>
                  </div>
                </div>
              )}
            </section>

            {/* RECENTLY FINISHED */}
            {stats.history.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className={`font-bold text-xs md:text-sm flex items-center gap-1.5 uppercase tracking-wider ${getThemeSubtextClass()}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>المنتهي حديثاً</span>
                </h3>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1.5 snap-x">
                  {stats.history.slice(0, 5).map((historyItem) => (
                    <div
                      key={historyItem.itemId}
                      onClick={() => {
                        const original = trackedItems.find((i) => i.id === historyItem.itemId);
                        if (original) setSelectedItem(original);
                      }}
                      className={`snap-start shrink-0 w-32 transition-all p-2 rounded-xl border cursor-pointer flex flex-col gap-2 group ${
                        theme === "minimal"
                          ? "bg-white hover:bg-neutral-50 border-neutral-200"
                          : theme === "netflix"
                            ? "bg-[#110f0c] hover:bg-[#1a1712] border-amber-950/20"
                            : theme === "material"
                              ? "bg-[#18181c] hover:bg-[#202024] border-zinc-900/50"
                              : "bg-[#0a0a0d] hover:bg-[#121217] border border-neutral-900/50"
                      }`}
                    >
                      {/* Clean Poster Image */}
                      <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-neutral-950 shrink-0">
                        <img
                          src={
                            historyItem.posterPath
                              ? historyItem.posterPath.startsWith("http")
                                ? historyItem.posterPath
                                : `https://image.tmdb.org/t/p/w300${historyItem.posterPath}`
                              : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop"
                          }
                          alt={historyItem.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col px-0.5">
                        <h4 className={`text-[11px] font-bold truncate leading-none ${
                          theme === "minimal" ? "text-neutral-950" : "text-white"
                        }`}>
                          {historyItem.title.split("|")[0].trim()}
                        </h4>
                        <span className={`text-[9px] mt-1 font-medium ${
                          theme === "minimal" ? "text-neutral-400 font-bold" : "text-neutral-500"
                        }`}>
                          {formatTimeAgo(historyItem.completedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUICK PREVIEW / DIRECT PASSAGE TO LIBRARY */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-bold text-xs md:text-sm flex items-center gap-1.5 uppercase tracking-wider ${getThemeSubtextClass()}`}>
                  <PlaySquare className="w-3.5 h-3.5" />
                  <span>لمحة من المكتبة</span>
                </h3>
                <button 
                  onClick={() => setActiveTab("library")} 
                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${getThemeSubtextClass()}`}
                >
                  <span>عرض الكل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {trackedItems.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border p-6 flex flex-col items-center gap-3 ${getThemeSectionClass()}`}>
                  <AlertCircle className="w-8 h-8 text-neutral-400 shrink-0" />
                  <span className={`text-xs ${getThemeSubtextClass()}`}>مكتبتك فارغة تماماً حتى الآن. ابدأ بالبحث وإضافة أول عمل تتبع!</span>
                  <button
                    onClick={() => setActiveTab("search")}
                    className={`mt-2 text-xs py-2 px-5 rounded-xl font-bold transition-all duration-300 ${
                      theme === "minimal"
                        ? "bg-neutral-950 text-white hover:bg-neutral-900"
                        : "bg-white text-black hover:bg-neutral-200"
                    }`}
                  >
                    البحث وإضافة أعمال
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {trackedItems.slice(0, 4).map((item) => (
                      <TrackedCard
                        key={item.id}
                        item={item}
                        theme={theme}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                  <ManualAddInlineForm onAdd={handleAddManualItem} theme={theme} />
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================== LIBRARY TAB ==================== */}
        {activeTab === "library" && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            {/* Header / Toolbar with filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className={`text-xl md:text-2xl font-bold ${getThemeHeadingClass()}`}>مكتبة التتبع الذاتي</h2>
                <p className={`text-xs mt-1 ${getThemeSubtextClass()}`}>كل مهمة مشاهدة تريد إنهاءها منظمة بأناقة</p>
              </div>

              {/* Interactive Toolbar */}
              <div className="flex items-center gap-2 mt-2 md:mt-0 select-none">
                {/* Search locally */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث محلياً..."
                    value={localSearchQuery === " " ? "" : localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value || " ")}
                    className={`text-xs rounded-xl pl-3.5 pr-8 py-2 w-44 focus:outline-none border transition-colors ${getThemeInputClass()}`}
                  />
                  <SearchIcon className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                </div>

                {/* Mode toggle (Poster Wall vs List) */}
                <button
                  onClick={() => setPosterWallMode(!posterWallMode)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${getThemeButtonClass()}`}
                  title={posterWallMode ? "العرض التفصيلي" : "عرض معرض الحائط للأفيشات"}
                >
                  {posterWallMode ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Filter Slider (All, Movies, TV, Anime, Favorites) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "all", label: "الكل" },
                { id: "movie", label: "الأفلام" },
                { id: "series", label: "المسلسلات" },
                { id: "anime", label: "الأنمي" },
                { id: "favorite", label: "المفضلة" },
              ].map((filter) => {
                const isActive = libraryFilter === filter.id;
                const activeStyle = isActive
                  ? theme === "minimal"
                    ? "bg-neutral-950 text-white font-bold shadow-sm"
                    : theme === "netflix"
                      ? "bg-amber-400 text-neutral-950 font-bold"
                      : theme === "material"
                        ? "bg-teal-400 text-neutral-950 font-bold"
                        : "bg-white text-neutral-950 font-bold shadow-md"
                  : getThemeButtonClass();

                return (
                  <button
                    key={filter.id}
                    onClick={() => setLibraryFilter(filter.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 shrink-0 ${activeStyle}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Library Grid rendering */}
            {(() => {
              // Apply filters
              const filtered = trackedItems.filter((item) => {
                // Match search locally
                const queryStr = localSearchQuery.trim().toLowerCase();
                const matchesSearch = queryStr === "" 
                  ? true 
                  : item.title.toLowerCase().includes(queryStr) || item.originalTitle?.toLowerCase().includes(queryStr);

                if (!matchesSearch) return false;

                // Match filter tab
                if (libraryFilter === "all") return true;
                if (libraryFilter === "favorite") return item.favorite;
                return item.category === libraryFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className={`text-center py-20 rounded-2xl border p-6 flex flex-col items-center gap-3 ${getThemeSectionClass()}`}>
                    <AlertCircle className="w-8 h-8 text-neutral-400 shrink-0" />
                    <span className={`text-xs ${getThemeSubtextClass()}`}>لا توجد أعمال تطابق الفلاتر الحالية في مكتبتك.</span>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2">
                  <motion.div
                    layout
                    className={`grid gap-4 ${
                      posterWallMode 
                        ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" 
                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                    }`}
                  >
                    <AnimatePresence>
                      {filtered.map((item) => (
                        <TrackedCard
                          key={item.id}
                          item={item}
                          theme={theme}
                          posterWallMode={posterWallMode}
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  <ManualAddInlineForm onAdd={handleAddManualItem} theme={theme} />
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== JOURNEY TAB ==================== */}
        {activeTab === "journey" && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <div>
              <h2 className={`text-xl md:text-2xl font-bold ${getThemeHeadingClass()}`}>رحلتي وإنجازاتي الحقيقية</h2>
              <p className={`text-xs mt-1 ${getThemeSubtextClass()}`}>إحصائيات إتمام حقيقية 100% مبنية على تقدمك الفعلي</p>
            </div>

            {/* Activity Heat Map component */}
            <StatsHeatMap theme={theme} activityData={activityHistory} />

            {/* Advanced Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
              <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${getThemeSectionClass()}`}>
                <span className={`text-[10px] font-bold uppercase ${getThemeSubtextClass()}`}>الأعمال المتعقبة</span>
                <span className={`text-lg md:text-2xl font-black font-mono ${getThemeHeadingTextClass()}`}>{stats.totalTitles}</span>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${getThemeSectionClass()}`}>
                <span className={`text-[10px] font-bold uppercase ${getThemeSubtextClass()}`}>مكتمل بالكامل</span>
                <span className="text-lg md:text-2xl font-black text-emerald-500 font-mono">{stats.completedCount}</span>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${getThemeSectionClass()}`}>
                <span className={`text-[10px] font-bold uppercase ${getThemeSubtextClass()}`}>قيد المتابعة والمهام</span>
                <span className={`text-lg md:text-2xl font-black font-mono ${theme === "minimal" ? "text-neutral-500" : "text-neutral-400"}`}>{stats.remainingCount}</span>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${getThemeSectionClass()}`}>
                <span className={`text-[10px] font-bold uppercase ${getThemeSubtextClass()}`}>نسبة الإنجاز الشاملة</span>
                <span className={`text-lg md:text-2xl font-black font-mono ${getThemeHeadingTextClass()}`}>{stats.completionRate}%</span>
              </div>
            </div>

            {/* Category Statistics Breakdown */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 shadow-sm transition-all duration-300 ${getThemeSectionClass()}`}>
              <h3 className={`font-bold text-xs md:text-sm ${getThemeHeadingTextClass()}`}>معدل الإنجاز حسب فئات التتبع</h3>
              
              <div className="flex flex-col gap-4 text-xs font-medium">
                {/* Movies Breakdown */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className={getThemeHeadingClass()}>🎬 الأفلام</span>
                    <span className={`font-mono ${getThemeSubtextClass()}`}>{stats.moviesCount.completed} / {stats.moviesCount.total} مكتمل</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    theme === "minimal" ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-900/20"
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        theme === "minimal" 
                          ? "bg-neutral-900" 
                          : theme === "netflix" 
                            ? "bg-amber-400" 
                            : theme === "material" 
                              ? "bg-teal-400" 
                              : "bg-white"
                      }`}
                      style={{ 
                        width: `${stats.moviesCount.total > 0 ? (stats.moviesCount.completed / stats.moviesCount.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* TV Series Breakdown */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className={getThemeHeadingClass()}>📺 المسلسلات</span>
                    <span className={`font-mono ${getThemeSubtextClass()}`}>{stats.seriesCount.completed} / {stats.seriesCount.total} مكتمل</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    theme === "minimal" ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-900/20"
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        theme === "minimal" 
                          ? "bg-neutral-900" 
                          : theme === "netflix" 
                            ? "bg-amber-400" 
                            : theme === "material" 
                              ? "bg-teal-400" 
                              : "bg-white"
                      }`}
                      style={{ 
                        width: `${stats.seriesCount.total > 0 ? (stats.seriesCount.completed / stats.seriesCount.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Anime Breakdown */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className={getThemeHeadingClass()}>🍥 الأنمي</span>
                    <span className={`font-mono ${getThemeSubtextClass()}`}>{stats.animeCount.completed} / {stats.animeCount.total} مكتمل</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    theme === "minimal" ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950 border-neutral-900/20"
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        theme === "minimal" 
                          ? "bg-neutral-900" 
                          : theme === "netflix" 
                            ? "bg-amber-400" 
                            : theme === "material" 
                              ? "bg-teal-400" 
                              : "bg-white"
                      }`}
                      style={{ 
                        width: `${stats.animeCount.total > 0 ? (stats.animeCount.completed / stats.animeCount.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Completion timeline logs */}
            <div className="flex flex-col gap-3">
              <h3 className={`font-bold text-xs md:text-sm uppercase tracking-wider ${getThemeSubtextClass()}`}>سجل الإنجاز والتخرج</h3>
              
              {stats.history.length === 0 ? (
                <div className={`text-center py-8 rounded-xl border text-xs ${
                  theme === "minimal" ? "bg-white border-neutral-200 text-neutral-500" : "bg-neutral-950/20 border-neutral-900/40 text-neutral-500"
                }`}>
                  لا يوجد أعمال مكتملة بالكامل حتى الآن. حافظ على التزامك لتسجيل أروع الإنجازات!
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {stats.history.map((log) => (
                    <div
                      key={log.itemId}
                      onClick={() => {
                        const original = trackedItems.find((i) => i.id === log.itemId);
                        if (original) setSelectedItem(original);
                      }}
                      className={`border p-3 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
                        theme === "minimal"
                          ? "bg-white hover:bg-neutral-50 border-neutral-200/80"
                          : theme === "netflix"
                            ? "bg-[#110f0c] hover:bg-[#1a1712] border-amber-950/20"
                            : theme === "material"
                              ? "bg-[#18181c] hover:bg-[#202024] border-zinc-900/50"
                              : "bg-[#0b0b0e] hover:bg-[#121217] border border-neutral-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Tiny poster */}
                        <div className="w-8 h-11 rounded bg-neutral-950 shrink-0 overflow-hidden shadow-sm">
                          <img
                            src={
                              log.posterPath
                                ? log.posterPath.startsWith("http")
                                  ? log.posterPath
                                  : `https://image.tmdb.org/t/p/w200${log.posterPath}`
                                : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200&auto=format&fit=crop"
                            }
                            alt={log.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${theme === "minimal" ? "text-neutral-900" : "text-neutral-100"}`}>{log.title.split("|")[0].trim()}</h4>
                          <p className={`text-[10px] mt-0.5 ${getThemeSubtextClass()}`}>
                            تم تصفية المهمة كـ مكتملة في {new Date(log.completedAt).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 px-2.5 py-1 rounded-md border ${
                        theme === "minimal"
                          ? "bg-neutral-100 border-neutral-200 text-neutral-600"
                          : "bg-neutral-950 border-neutral-900 text-neutral-400"
                      }`}>
                        {formatTimeAgo(log.completedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SEARCH TAB ==================== */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">البحث السريع الذكي</h2>
              <p className="text-xs text-neutral-500 mt-1">ابحث في مكتبتك أولاً، ثم استكشف قاعدة بيانات TMDB مباشرة</p>
            </div>

            {/* Smart Search box layout */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن فيلم، مسلسل، أو أنمي باللغة العربية أو الإنجليزية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0b0b0e] border border-neutral-900/60 w-full text-sm rounded-xl pl-4 pr-11 py-3.5 focus:outline-none focus:border-neutral-700 text-neutral-200"
                  autoFocus
                />
                <SearchIcon className="absolute right-4 top-4.5 w-4.5 h-4.5 text-neutral-400" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute left-4 top-4 w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
                  >
                    <X className="w-3 h-3 text-neutral-400" />
                  </button>
                )}
              </div>
              
              {searchingOnline && (
                <span className="text-[11px] text-neutral-500 flex items-center gap-2 pr-1 animate-pulse">
                  <span>●</span> {searchFeedback}
                </span>
              )}
            </div>

            {/* MANUAL ADDITION AS A FALLBACK (Always available when offline or looking for niche titles!) */}
            {searchQuery && (
              <section className="bg-white/[0.01] border border-neutral-900/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">ألا تجد العنوان الذي تبحث عنه؟</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">يمكنك إضافة عمل بشكل مخصص ويدوي بالكامل إلى مكتبتك وبدء تتبعه فوراً.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddManualItem(searchQuery, "movie")}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] md:text-xs text-neutral-300 font-bold py-2 px-3.5 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة كـ فيلم يدوي</span>
                  </button>
                  <button
                    onClick={() => handleAddManualItem(searchQuery, "series")}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] md:text-xs text-neutral-300 font-bold py-2 px-3.5 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة كـ مسلسل يدوي</span>
                  </button>
                </div>
              </section>
            )}

            {/* SECTION 1: SEARCHING WITHIN MY LOCAL LIBRARY */}
            {(() => {
              if (!searchQuery) return null;
              
              const localMatched = trackedItems.filter(
                (item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.originalTitle?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (localMatched.length === 0) return null;

              return (
                <section className="flex flex-col gap-3">
                  <h3 className="font-bold text-xs md:text-sm text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <PlaySquare className="w-3.5 h-3.5 text-neutral-400" />
                    <span>موجود في مكتبتك ({localMatched.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {localMatched.map((item) => (
                      <TrackedCard
                        key={item.id}
                        item={item}
                        theme={theme}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* SECTION 2: SEARCHING ONLINE (TMDB) */}
            {searchQuery && searchResults.length > 0 && (
              <section className="flex flex-col gap-4">
                <h3 className="font-bold text-xs md:text-sm text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider border-t border-neutral-900/60 pt-4">
                  <Tv className="w-3.5 h-3.5 text-neutral-400" />
                  <span>نتائج البحث في TMDB</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {searchResults.map((tmdbItem) => {
                    const isMovie = tmdbItem.media_type === "movie";
                    const isAdded = trackedItems.some(
                      (item) => item.tmdbId === tmdbItem.id && item.type === tmdbItem.media_type
                    );

                    const titleText = tmdbItem.title || tmdbItem.name || "عنوان غير معروف";
                    const originalTitleText = tmdbItem.original_title || tmdbItem.original_name;
                    const dateText = tmdbItem.release_date || tmdbItem.first_air_date || "";
                    const year = dateText ? dateText.split("-")[0] : "";

                    const posterUrl = tmdbItem.poster_path
                      ? `https://image.tmdb.org/t/p/w300${tmdbItem.poster_path}`
                      : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop";

                    return (
                      <div
                        key={`${tmdbItem.media_type}_${tmdbItem.id}`}
                        className="bg-[#0b0b0e] border border-neutral-900/50 p-3 rounded-xl flex items-center justify-between gap-4 hover:border-neutral-800 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Mini poster with clean ratio */}
                          <div className="w-10 h-14 rounded-lg bg-neutral-950 shrink-0 overflow-hidden shadow-md">
                            <img
                              src={posterUrl}
                              alt={titleText}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-neutral-100 truncate">{titleText}</h4>
                            {originalTitleText && originalTitleText !== titleText && (
                              <p className="text-[9px] text-neutral-500 font-mono truncate">{originalTitleText}</p>
                            )}
                            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mt-1 font-medium">
                              <span className="px-1 py-0.5 rounded bg-neutral-900 text-neutral-400">
                                {isMovie ? "فيلم" : "مسلسل"}
                              </span>
                              {year && <span>• {year}</span>}
                              {tmdbItem.vote_average > 0 && (
                                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                  ★ {tmdbItem.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add to Library (+) Trigger */}
                        {isAdded ? (
                          <span className="text-[10px] font-bold text-emerald-500 shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            مضاف في مكتبتك
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddTmdbItem(tmdbItem)}
                            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all duration-200 text-neutral-300"
                          >
                            <Plus className="w-4 h-4" />
                            <span>تتبع العمل</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty Input prompt */}
            {!searchQuery && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-neutral-500" />
                </div>
                <h4 className="text-sm font-bold text-neutral-300">استكشف ووثق تقدمك</h4>
                <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
                  اكتب اسم المسلسل أو الفيلم المفضل لديك في شريط البحث بالأعلى للبحث داخلياً أو المزامنة مع قاعدة بيانات TMDB العالمية.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <div>
              <h2 className={`text-xl md:text-2xl font-bold ${getThemeHeadingClass()}`}>إعدادات النظام والنسخ الاحتياطي</h2>
              <p className={`text-xs mt-1 ${getThemeSubtextClass()}`}>خصص مظهر التطبيق أو قم بحماية بيانات المشاهدة بضغطة واحدة</p>
            </div>

            {/* Multi Theme Selector */}
            <section className={`rounded-2xl p-5 md:p-6 shadow-sm border flex flex-col gap-4 transition-all duration-300 ${getThemeSectionClass()}`}>
              <h3 className={`font-bold text-xs md:text-sm ${getThemeHeadingTextClass()}`}>مظهر وثيمات الواجهة</h3>
              <p className={`text-[11px] ${getThemeSubtextClass()}`}>اختر طابعك البصري المفضل، جميع الثيمات تحافظ على الهوية الداكنة المريحة للعين</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "oled-black", label: "OLED Black", desc: "أسود مطلق وموفر للطاقة" },
                  { id: "material", label: "Material Slate", desc: "تدرجات رمادية وزرقاء هادئة" },
                  { id: "netflix", label: "Amber Cinematic", desc: "أصفر ذهبي وتصميم سينمائي فاخر" },
                  { id: "minimal", label: "Minimal Dark", desc: "مستوحى من بساطة نظام آبل" },
                ].map((th) => {
                  const isActive = theme === th.id;
                  const cardStyle = isActive
                    ? theme === "minimal"
                      ? "bg-neutral-900 border-neutral-950 text-white shadow-lg scale-[1.01]"
                      : theme === "netflix"
                        ? "bg-amber-400/5 border-amber-400 text-amber-400 shadow-md scale-[1.01]"
                        : theme === "material"
                          ? "bg-teal-400/5 border-teal-400 text-teal-400 shadow-md scale-[1.01]"
                          : "bg-white/[0.03] border-white text-white shadow-md scale-[1.01]"
                    : theme === "minimal"
                      ? "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      : "bg-neutral-950/40 border-neutral-900/60 text-neutral-400 hover:bg-neutral-900/30";

                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        setTheme(th.id as ThemeType);
                        localStorage.setItem("wv_theme", th.id);
                        showToast(`تم تطبيق ثيم ${th.label} بنجاح.`);
                      }}
                      className={`flex flex-col text-right p-4 rounded-xl border transition-all duration-300 gap-1.5 ${cardStyle}`}
                    >
                      <span className={`text-xs font-bold ${
                        isActive 
                          ? "" 
                          : theme === "minimal" 
                            ? "text-neutral-800" 
                            : "text-neutral-200"
                      }`}>{th.label}</span>
                      <span className={`text-[9px] leading-normal ${
                        theme === "minimal" ? "text-neutral-400" : "text-neutral-500"
                      }`}>{th.desc}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Export / Import backup systems */}
            <section className={`rounded-2xl p-5 md:p-6 shadow-sm border flex flex-col gap-4 transition-all duration-300 ${getThemeSectionClass()}`}>
              <h3 className={`font-bold text-xs md:text-sm ${getThemeHeadingTextClass()}`}>أمن بياناتك والنسخ الاحتياطي</h3>
              <p className={`text-[11px] ${getThemeSubtextClass()}`}>تطبيق WatchVault يحفظ جميع بياناتك محلياً بشكل آمن تماماً، ويمكنك تصديرها واستيرادها على أي جهاز بضغطة زر واحدة</p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-1.5 w-full">
                {/* Export Button */}
                <button
                  onClick={handleExportBackup}
                  className={`w-full sm:w-auto text-xs font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 border ${getThemeButtonClass()}`}
                >
                  <FileDown className="w-4 h-4 text-neutral-400" />
                  <span>تصدير ملف المكتبة (Export JSON)</span>
                </button>

                {/* Copy Backup to Clipboard */}
                <button
                  onClick={handleCopyBackupToClipboard}
                  className={`w-full sm:w-auto text-xs font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 border ${getThemeButtonClass()}`}
                >
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>نسخ النسخ الاحتياطي (Copy JSON)</span>
                </button>

                {/* Import Button with hidden input trigger */}
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full sm:w-auto text-xs font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 border ${getThemeButtonClass()}`}
                >
                  <FileUp className="w-4 h-4 text-neutral-400" />
                  <span>استيراد ملف مكتبة (Import JSON)</span>
                </button>
              </div>
            </section>

            {/* TV Time Importer Card */}
            <section className={`rounded-2xl p-5 md:p-6 shadow-sm border flex flex-col gap-4 transition-all duration-300 ${
              theme === "netflix" 
                ? "bg-[#161208] border-amber-500/20" 
                : "bg-amber-500/[0.02] border-amber-500/10"
            }`}>
              <div className="flex items-start gap-3.5" dir="rtl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-xs md:text-sm text-amber-400">استيراد مكتبة TV Time</h3>
                  <p className={`text-[11px] leading-relaxed mt-1 ${getThemeSubtextClass()}`}>
                    هل لديك حساب سابق في TV Time؟ يمكنك نقل مسلسلاتك، أفلامك، وجميع الحلقات التي شاهدتها إلى مكتبتك هنا في ثوانٍ!
                  </p>
                </div>
              </div>

              {/* Guide instructions */}
              <div className={`p-4 rounded-xl border text-[11px] leading-relaxed flex flex-col gap-2 ${
                theme === "minimal" 
                  ? "bg-amber-50/50 border-amber-200 text-amber-900" 
                  : "bg-amber-500/5 border-amber-500/10 text-amber-200"
              }`} dir="rtl">
                <span className="font-bold flex items-center gap-1.5 text-xs text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  طريقة نقل البيانات بخطوات بسيطة:
                </span>
                <ul className="list-disc list-inside space-y-1.5 pr-1 text-neutral-400 text-right">
                  <li>
                    يمكنك استخدام إضافة المتصفح <strong className="text-amber-400">TV Time Liberator</strong> لتحميل ملفات <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 text-[10px]">shows.json</code> و <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 text-[10px]">movies.json</code> ورفعها مباشرة.
                  </li>
                  <li>
                    أو ارفع ملفات الـ GDPR الرسمية التي تصلك من TV Time مباشرة مثل <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 text-[10px]">followed_shows.csv</code> و <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 text-[10px]">seen_episodes.csv</code> و <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 text-[10px]">followed_movies.csv</code>.
                  </li>
                  <li className="text-amber-500/90 font-medium list-none mt-2">
                    💡 تلميح: يمكنك اختيار ورفع عدة ملفات معاً في نفس الوقت (مثل ملف المسلسلات وملف الحلقات) لتتم مطابقتها ودمج تقدمك تلقائياً!
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-1.5 w-full">
                <input
                  type="file"
                  accept=".json,.csv"
                  multiple
                  ref={tvTimeInputRef}
                  onChange={handleImportTVTime}
                  className="hidden"
                />
                <button
                  onClick={() => tvTimeInputRef.current?.click()}
                  className={`w-full sm:w-auto text-xs font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm ${
                    theme === "minimal"
                      ? "bg-neutral-950 hover:bg-neutral-900 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-neutral-950"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>اختر ملفات TV Time (JSON / CSV)</span>
                </button>
              </div>
            </section>

            {/* Reset App and data scrubbing */}
            <section className="bg-red-950/5 border border-red-900/20 rounded-2xl p-5 md:p-6 flex flex-col gap-3.5 shadow-sm">
              <div>
                <h3 className="font-bold text-xs md:text-sm text-red-400">منطقة الخطر وإعادة التعيين</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">سيتم إزالة جميع الأفلام والمسلسلات وسجلات النشاط المخصصة وحذفها نهائياً من الذاكرة المحلية للجهاز</p>
              </div>
              <button
                onClick={handleResetApp}
                className="w-full sm:w-max bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-300 hover:text-red-200 text-xs font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>مسح جميع البيانات وإعادة تعيين التطبيق</span>
              </button>
            </section>
          </div>
        )}

      </main>

      {/* Item Details Immersive modal overlay */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailsModal
            key={selectedItem.id}
            item={selectedItem}
            theme={theme}
            onClose={() => setSelectedItem(null)}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
