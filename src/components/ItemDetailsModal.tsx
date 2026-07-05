import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrackedItem, Season, Episode, ThemeType } from "../types";
import { X, Calendar, Clock, Star, Film, CheckCircle2, Heart, RefreshCw, AlertCircle } from "lucide-react";

interface ItemDetailsModalProps {
  item: TrackedItem;
  theme: ThemeType;
  onClose: () => void;
  onUpdateItem: (updatedItem: TrackedItem) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  theme,
  onClose,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(
    item.currentSeason || (item.seasons && item.seasons.length > 0 ? item.seasons[0].seasonNumber : 1)
  );
  const [seasonsData, setSeasonsData] = useState<Season[]>(item.seasons || []);
  const [loadingSeason, setLoadingSeason] = useState<boolean>(false);
  const [errorSeason, setErrorSeason] = useState<string | null>(null);

  // Active season object
  const activeSeason = seasonsData.find((s) => s.seasonNumber === selectedSeasonNum);

  // Fetch season episodes from TMDB if not already loaded or empty
  useEffect(() => {
    if (item.type !== "tv" || !item.tmdbId) return;

    const needsLoad = !activeSeason || !activeSeason.episodes || activeSeason.episodes.length === 0;

    if (needsLoad) {
      fetchSeasonEpisodes(item.tmdbId, selectedSeasonNum);
    }
  }, [selectedSeasonNum, item.id]);

  // Synchronize seasons state with item changes
  useEffect(() => {
    setSeasonsData(item.seasons || []);
  }, [item.seasons]);

  const fetchSeasonEpisodes = async (tmdbId: number, seasonNum: number) => {
    setLoadingSeason(true);
    setErrorSeason(null);
    try {
      const response = await fetch(`/api/season?id=${tmdbId}&season=${seasonNum}&language=ar`);
      if (!response.ok) {
        throw new Error("فشل جلب تفاصيل الموسم من TMDB");
      }
      const data = await response.json();
      
      const apiEpisodes = data.episodes || [];
      const newEpisodes: Episode[] = apiEpisodes.map((ep: any) => ({
        episodeNumber: ep.episode_number,
        name: ep.name || `الحلقة ${ep.episode_number}`,
        completed: false, // Default to unchecked
        airDate: ep.air_date,
      }));

      setSeasonsData((prev) => {
        // Find if season exists in prev, if so update episodes, else add it
        const index = prev.findIndex((s) => s.seasonNumber === seasonNum);
        let updated: Season[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = {
            ...updated[index],
            episodes: newEpisodes,
            episodeCount: newEpisodes.length,
            isLoaded: true,
          };
        } else {
          updated = [
            ...prev,
            {
              seasonNumber: seasonNum,
              name: `الموسم ${seasonNum}`,
              episodeCount: newEpisodes.length,
              episodes: newEpisodes,
              isLoaded: true,
            },
          ];
        }

        // Send update to parent state
        onUpdateItem({
          ...item,
          seasons: updated,
        });

        return updated;
      });
    } catch (err: any) {
      console.error("Error fetching season episodes:", err);
      // Fallback: Generate generic episodes so it works offline or on error!
      generateFallbackEpisodes(seasonNum);
    } finally {
      setLoadingSeason(false);
    }
  };

  const generateFallbackEpisodes = (seasonNum: number) => {
    // Generate some standard episodes
    const count = 10; // Default count
    const fallbackEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
      episodeNumber: i + 1,
      name: `الحلقة ${i + 1}`,
      completed: false,
    }));

    setSeasonsData((prev) => {
      const index = prev.findIndex((s) => s.seasonNumber === seasonNum);
      let updated: Season[];
      if (index >= 0) {
        // If already has episodes, do not overwrite
        if (prev[index].episodes && prev[index].episodes.length > 0) return prev;
        updated = [...prev];
        updated[index] = {
          ...updated[index],
          episodes: fallbackEpisodes,
          isLoaded: true,
        };
      } else {
        updated = [
          ...prev,
          {
            seasonNumber: seasonNum,
            name: `الموسم ${seasonNum}`,
            episodeCount: count,
            episodes: fallbackEpisodes,
            isLoaded: true,
          },
        ];
      }

      onUpdateItem({
        ...item,
        seasons: updated,
      });

      return updated;
    });
  };

  // Smart Checklist Logic:
  // - If episode checked: check all previous episodes automatically.
  // - If episode unchecked: uncheck all subsequent episodes automatically.
  const handleEpisodeToggle = (episodeNum: number, checked: boolean) => {
    if (!activeSeason || !activeSeason.episodes) return;

    const updatedEpisodes = activeSeason.episodes.map((ep) => {
      if (checked) {
        // If checked, check this and all previous episodes
        if (ep.episodeNumber <= episodeNum) {
          return { ...ep, completed: true };
        }
      } else {
        // If unchecked, uncheck this and all subsequent episodes
        if (ep.episodeNumber >= episodeNum) {
          return { ...ep, completed: false };
        }
      }
      return ep;
    });

    const updatedSeasons = seasonsData.map((s) => {
      if (s.seasonNumber === selectedSeasonNum) {
        return {
          ...s,
          episodes: updatedEpisodes,
        };
      }
      return s;
    });

    // Check if ALL episodes in the series are now completed
    const allCompleted = updatedSeasons.every((s) =>
      s.episodes && s.episodes.length > 0 && s.episodes.every((ep) => ep.completed)
    );

    const updatedItem: TrackedItem = {
      ...item,
      seasons: updatedSeasons,
      status: allCompleted ? "completed" : "watching",
      completedAt: allCompleted ? new Date().toISOString() : item.completedAt,
      currentSeason: selectedSeasonNum,
      updatedAt: new Date().toISOString(),
    };

    setSeasonsData(updatedSeasons);
    onUpdateItem(updatedItem);
  };

  // Movie completion handler
  const handleMovieCompletionToggle = () => {
    const isCompleted = item.status === "completed";
    const updatedItem: TrackedItem = {
      ...item,
      status: isCompleted ? "watching" : "completed",
      completedAt: isCompleted ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateItem(updatedItem);
  };

  const handleFavoriteToggle = () => {
    onUpdateItem({
      ...item,
      favorite: !item.favorite,
      updatedAt: new Date().toISOString(),
    });
  };

  // Colors & styling based on active theme
  const getAccentColor = () => {
    if (theme === "netflix") return "bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold";
    if (theme === "material") return "bg-teal-500 hover:bg-teal-600 text-neutral-900 font-semibold";
    if (theme === "minimal") return "bg-neutral-100 hover:bg-neutral-200 text-black";
    return "bg-white hover:bg-neutral-100 text-black"; // OLED Black
  };

  const getAccentBorder = () => {
    if (theme === "netflix") return "border-amber-400/30";
    if (theme === "material") return "border-teal-500/30";
    return "border-neutral-800";
  };

  const backdropUrl = item.backdropPath
    ? item.backdropPath.startsWith("http")
      ? item.backdropPath
      : `https://image.tmdb.org/t/p/w1280${item.backdropPath}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop";

  const posterUrl = item.posterPath
    ? item.posterPath.startsWith("http")
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w500${item.posterPath}`
    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative bg-[#08080a] border border-neutral-900 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-black max-h-[90vh] flex flex-col glow-subtle"
        id="item-detail-modal"
      >
        {/* Close & Favorite Floating Controls */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <button
            onClick={handleFavoriteToggle}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-black/80 transition-colors"
            title="إضافة للمفضلة"
          >
            <Heart className={`w-4 h-4 ${item.favorite ? "text-red-500 fill-red-500" : "text-neutral-400"}`} />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-grow no-scrollbar">
          {/* Backdrop Header with gradient overlays */}
          <div className="relative h-48 md:h-64 w-full bg-neutral-950 shrink-0">
            <img
              src={backdropUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Ambient vignette overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#08080a]/20 to-[#08080a]" />
          </div>

          {/* Core Content Layout */}
          <div className="px-6 md:px-8 pb-8 relative -mt-16 md:-mt-24 z-10 flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Pristine Poster Column */}
            <div className="w-32 md:w-44 shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-neutral-950 shadow-2xl border border-neutral-900 relative">
                <img
                  src={posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={() => {
                  if (confirm("هل أنت متأكد من حذف هذا العمل من مكتبتك؟")) {
                    onDeleteItem(item.id);
                    onClose();
                  }
                }}
                className="w-full mt-4 text-[10px] text-neutral-500 hover:text-red-400 text-center py-1 transition-colors"
              >
                إزالة من المكتبة
              </button>
            </div>

            {/* Info and Progress Column */}
            <div className="flex-grow flex flex-col gap-4">
              {/* Category & Title */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  {item.category === "anime" ? "أنمي" : item.category === "series" ? "مسلسل تلفزيوني" : "فيلم"}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white mt-1 leading-tight">
                  {item.title.split("|")[0].trim()}
                </h2>
                {item.originalTitle && item.originalTitle !== item.title.split("|")[0].trim() && (
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.originalTitle}</p>
                )}
              </div>

              {/* Badges/Metadata */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-400 border-b border-neutral-900/60 pb-3 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{item.releaseDate ? item.releaseDate.split("-")[0] : "مستمر"}</span>
                </div>
                {item.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{item.runtime} دقيقة</span>
                  </div>
                )}
                {item.rating && item.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating.toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              {/* Overview / Story Description */}
              {item.overview && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-neutral-400">القصة</span>
                  <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    {item.overview}
                  </p>
                </div>
              )}

              {/* Genres tags */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.genres.map((g, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800/30">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Movie Action / TV Checklist */}
              {item.type === "movie" ? (
                <div className="mt-4 pt-4 border-t border-neutral-900/40">
                  <button
                    onClick={handleMovieCompletionToggle}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl w-full md:w-auto transition-all duration-300 ${getAccentColor()}`}
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>{item.status === "completed" ? "تحديد كـ غير مكتمل" : "تعليم كمكتمل وبطل الجولة"}</span>
                  </button>
                </div>
              ) : (
                /* Series / Anime Checklist Component */
                <div className="mt-4 pt-4 border-t border-neutral-900/40">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-200">تتبع الحلقات الذكي</h3>
                      <p className="text-[10px] text-neutral-500">الحلقات منسقة كـ قائمة مهام شخصية لإنجازها</p>
                    </div>

                    {/* Season Dropdown Selector */}
                    {item.totalSeasons && item.totalSeasons > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">الموسم:</span>
                        <select
                          value={selectedSeasonNum}
                          onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                          className="bg-[#0c0c0f] text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 border border-neutral-800/60 focus:outline-none focus:ring-1 focus:ring-neutral-700"
                        >
                          {Array.from({ length: item.totalSeasons }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              الموسم {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Episodes List Container */}
                  <div className={`bg-[#050507] rounded-xl border ${getAccentBorder()} p-1 overflow-hidden max-h-[300px] overflow-y-auto`}>
                    {loadingSeason ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <RefreshCw className="w-5 h-5 text-neutral-500 animate-spin" />
                        <span className="text-xs text-neutral-500">جاري تحميل قائمة الحلقات...</span>
                      </div>
                    ) : errorSeason ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                        <AlertCircle className="w-5 h-5 text-neutral-500" />
                        <span className="text-xs text-neutral-400">{errorSeason}</span>
                        <button
                          onClick={() => generateFallbackEpisodes(selectedSeasonNum)}
                          className="mt-2 text-[10px] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-md text-neutral-300"
                        >
                          استخدام قائمة تلقائية
                        </button>
                      </div>
                    ) : activeSeason && activeSeason.episodes && activeSeason.episodes.length > 0 ? (
                      <div className="divide-y divide-neutral-900/40">
                        {activeSeason.episodes.map((ep) => (
                          <label
                            key={ep.episodeNumber}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.01] transition-all duration-200 group ${
                              ep.completed ? "opacity-60" : "opacity-100"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className="text-xs font-mono text-neutral-500 w-4 shrink-0">
                                {ep.episodeNumber}
                              </span>
                              <span className={`text-xs md:text-sm font-medium truncate ${
                                ep.completed ? "line-through text-neutral-500" : "text-neutral-200"
                              }`}>
                                {ep.name}
                              </span>
                            </div>

                            {/* Custom Checkbox mimicking Apple/Material UI style */}
                            <input
                              type="checkbox"
                              checked={ep.completed}
                              onChange={(e) => handleEpisodeToggle(ep.episodeNumber, e.target.checked)}
                              className="w-4.5 h-4.5 rounded-full border border-neutral-700 bg-transparent text-white checked:bg-neutral-200 checked:border-neutral-200 focus:ring-0 cursor-pointer shrink-0 appearance-none flex items-center justify-center after:content-['✓'] after:hidden checked:after:block after:text-[10px] after:text-neutral-950 after:font-bold"
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <span className="text-xs text-neutral-500">لا توجد حلقات للموسم المختار</span>
                        <button
                          onClick={() => generateFallbackEpisodes(selectedSeasonNum)}
                          className="text-[10px] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-md text-neutral-300"
                        >
                          إنشاء قائمة حلقات تلقائية
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
