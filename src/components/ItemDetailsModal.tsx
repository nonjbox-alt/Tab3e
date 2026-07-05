import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrackedItem, Season, Episode, ThemeType, getApiUrl } from "../types";
import { X, Calendar, Clock, Star, Film, CheckCircle2, Heart, RefreshCw, AlertCircle, Trash2, Edit, Image as ImageIcon, Save, Plus, Minus } from "lucide-react";

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

  // Editing and custom confirmation states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(item.title || "");
  const [editPoster, setEditPoster] = useState<string>(item.posterPath || "");
  const [editBackdrop, setEditBackdrop] = useState<string>(item.backdropPath || "");
  const [customSeasonsCount, setCustomSeasonsCount] = useState<number>(item.totalSeasons || 1);
  const [customEpisodesCount, setCustomEpisodesCount] = useState<number>(
    item.seasons && item.seasons[0] && item.seasons[0].episodes ? item.seasons[0].episodes.length : 10
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

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

  // Synchronize edit states when item changes
  useEffect(() => {
    setEditTitle(item.title || "");
    setEditPoster(item.posterPath || "");
    setEditBackdrop(item.backdropPath || "");
    setCustomSeasonsCount(item.totalSeasons || 1);
    setCustomEpisodesCount(
      item.seasons && item.seasons[0] && item.seasons[0].episodes ? item.seasons[0].episodes.length : 10
    );
    setIsEditing(false);
    setShowConfirmDelete(false);
  }, [item.id]);

  const fetchSeasonEpisodes = async (tmdbId: number, seasonNum: number) => {
    setLoadingSeason(true);
    setErrorSeason(null);
    try {
      const response = await fetch(getApiUrl(`/api/season?id=${tmdbId}&season=${seasonNum}&language=ar`));
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

  const handleSaveEdit = () => {
    let updatedSeasons = [...seasonsData];
    
    if (item.type === "tv") {
      const desiredSeasons = Math.max(1, Number(customSeasonsCount) || 1);
      const desiredEpisodesPerSeason = Math.max(1, Number(customEpisodesCount) || 10);
      
      // Rebuild if count changed or to fit the user's specific selection
      if (desiredSeasons !== updatedSeasons.length || (updatedSeasons[0]?.episodes?.length !== desiredEpisodesPerSeason)) {
        updatedSeasons = [];
        for (let s = 1; s <= desiredSeasons; s++) {
          const fallbackEpisodes = Array.from({ length: desiredEpisodesPerSeason }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: false,
          }));
          updatedSeasons.push({
            seasonNumber: s,
            name: `الموسم ${s}`,
            episodeCount: desiredEpisodesPerSeason,
            episodes: fallbackEpisodes,
            isLoaded: true,
          });
        }
      }
    }

    const updatedItem: TrackedItem = {
      ...item,
      title: editTitle.trim() || item.title,
      posterPath: editPoster.trim() || null,
      backdropPath: editBackdrop.trim() || null,
      totalSeasons: item.type === "tv" ? Math.max(1, Number(customSeasonsCount) || 1) : undefined,
      seasons: item.type === "tv" ? updatedSeasons : undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdateItem(updatedItem);
    setSeasonsData(updatedSeasons);
    setIsEditing(false);
  };

  // Colors & styling based on active theme
  const getAccentColor = () => {
    if (theme === "netflix") return "bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-400/10";
    if (theme === "material") return "bg-zinc-100 hover:bg-white text-neutral-950 font-bold";
    if (theme === "minimal") return "bg-neutral-950 hover:bg-neutral-900 text-white font-bold";
    return "bg-white hover:bg-neutral-100 text-black font-bold"; // OLED Black
  };

  const getAccentBorder = () => {
    if (theme === "minimal") return "border-neutral-200";
    if (theme === "netflix") return "border-amber-950/20";
    if (theme === "material") return "border-zinc-900";
    return "border-neutral-900/60";
  };

  const getSectionBg = () => {
    if (theme === "minimal") return "bg-neutral-50 border-neutral-200/60 text-neutral-950";
    if (theme === "netflix") return "bg-[#11100c] border-amber-950/20 text-amber-100";
    if (theme === "material") return "bg-[#18181c] border-zinc-900/50 text-zinc-100";
    return "bg-[#0b0b0e] border-neutral-900/50 text-neutral-100"; // OLED Black
  };

  const getModalBg = () => {
    if (theme === "minimal") return "bg-white border-neutral-200 text-neutral-950";
    if (theme === "netflix") return "bg-[#0d0c09] border-amber-950/20 text-amber-100";
    if (theme === "material") return "bg-[#121214] border-zinc-900/60 text-zinc-100";
    return "bg-[#050507] border-neutral-900/60 text-neutral-100"; // OLED Black
  };

  const getBackdropOverlay = () => {
    if (theme === "minimal") return "from-white via-white/50 to-transparent";
    if (theme === "netflix") return "from-[#0d0c09] via-[#0d0c09]/50 to-transparent";
    if (theme === "material") return "from-[#121214] via-[#121214]/50 to-transparent";
    return "from-[#050507] via-[#050507]/50 to-transparent";
  };

  const textTitle = theme === "minimal" ? "text-neutral-950" : "text-white";
  const textSub = theme === "minimal" ? "text-neutral-500" : "text-neutral-400";
  const textMain = theme === "minimal" ? "text-neutral-700" : "text-neutral-300";

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
        className={`relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border transition-colors duration-300 ${getModalBg()}`}
        id="item-detail-modal"
      >
        {/* Custom Deletion Confirmation Dialog Overlay */}
        <AnimatePresence>
          {showConfirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 animate-bounce">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white">تأكيد حذف العمل نهائياً؟</h3>
              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mt-2">
                هل أنت متأكد من رغبتك في حذف <strong>"{item.title}"</strong> نهائياً من مكتبتك؟ سيؤدي هذا إلى إزالة جميع سجلات المشاهدة وتقدمك فيه بشكل لا يمكن استعادته.
              </p>
              <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
                <button
                  onClick={() => {
                    onDeleteItem(item.id);
                    onClose();
                  }}
                  className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  نعم، احذف الآن
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-3 px-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  تراجع وإلغاء
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close, Favorite & Delete Floating Controls */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-colors group"
            title="إزالة من المكتبة"
          >
            <Trash2 className="w-4 h-4 text-neutral-400 group-hover:text-red-400 transition-colors" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-amber-500/10 hover:border-amber-500/20 transition-colors group ${isEditing ? "border-amber-500/50" : ""}`}
            title="تعديل تفاصيل العمل"
          >
            <Edit className={`w-4 h-4 ${isEditing ? "text-amber-400" : "text-neutral-400"} group-hover:text-amber-400 transition-colors`} />
          </button>
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
            <div className={`absolute inset-0 bg-gradient-to-t ${getBackdropOverlay()}`} />
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent`} />
          </div>

          {/* Core Content Layout */}
          <div className="px-6 md:px-8 pb-8 relative -mt-16 md:-mt-24 z-10 flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Pristine Poster Column */}
            <div className="w-32 md:w-44 shrink-0 mx-auto md:mx-0">
              <div className={`aspect-[2/3] w-full rounded-xl overflow-hidden bg-neutral-950 shadow-2xl border relative ${theme === "minimal" ? "border-neutral-200" : "border-neutral-900"}`}>
                <img
                  src={posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Info and Progress Column */}
            <div className="flex-grow flex flex-col gap-4">
              {isEditing ? (
                /* Edit Mode View */
                <div className="flex flex-col gap-4 text-right animate-fade-in">
                  <div>
                    <h3 className={`font-bold text-sm ${textTitle} flex items-center gap-1.5`}>
                      <Edit className="w-4 h-4 text-amber-500" />
                      <span>تعديل تفاصيل العمل المخصص</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">تعديل الاسم، غلاف البوستر، غلاف البنر، والمواسم والحلقات يدويّاً</p>
                  </div>

                  {/* Title Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-neutral-400">اسم العمل</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`text-xs rounded-xl px-3.5 py-3 border focus:outline-none ${
                        theme === "minimal"
                          ? "bg-neutral-50 text-neutral-800 border-neutral-200"
                          : "bg-[#0c0c0f] text-neutral-200 border-neutral-800/60"
                      }`}
                      placeholder="أدخل اسم الفيلم أو المسلسل..."
                    />
                  </div>

                  {/* Poster Path Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-neutral-400">رابط صورة الغلاف (البوستر - Poster URL)</label>
                    <input
                      type="text"
                      value={editPoster}
                      onChange={(e) => setEditPoster(e.target.value)}
                      className={`text-xs rounded-xl px-3.5 py-3 border focus:outline-none ${
                        theme === "minimal"
                          ? "bg-neutral-50 text-neutral-800 border-neutral-200"
                          : "bg-[#0c0c0f] text-neutral-200 border-neutral-800/60"
                      }`}
                      placeholder="مثال: https://link-to-image.jpg"
                    />
                    <span className="text-[9px] text-neutral-500">
                      💡 يمكنك نسخ ولصق أي رابط صورة من جوجل أو أي موقع لتخصيص بوستر العمل!
                    </span>
                  </div>

                  {/* Backdrop Path Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-neutral-400">رابط غلاف الخلفية (البنر - Banner / Backdrop URL)</label>
                    <input
                      type="text"
                      value={editBackdrop}
                      onChange={(e) => setEditBackdrop(e.target.value)}
                      className={`text-xs rounded-xl px-3.5 py-3 border focus:outline-none ${
                        theme === "minimal"
                          ? "bg-neutral-50 text-neutral-800 border-neutral-200"
                          : "bg-[#0c0c0f] text-neutral-200 border-neutral-800/60"
                      }`}
                      placeholder="مثال: https://link-to-image.jpg"
                    />
                  </div>

                  {/* TV Seasons and Episodes count fields */}
                  {item.type === "tv" && (
                    <div className="grid grid-cols-2 gap-4 border-t border-neutral-900/30 pt-4">
                      {/* Seasons count */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-neutral-400">عدد المواسم</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomSeasonsCount(Math.max(1, customSeasonsCount - 1))}
                            className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center bg-black/40 hover:bg-neutral-900 text-neutral-400 text-xs font-bold cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-black font-mono w-10 text-center text-white">{customSeasonsCount}</span>
                          <button
                            type="button"
                            onClick={() => setCustomSeasonsCount(customSeasonsCount + 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center bg-black/40 hover:bg-neutral-900 text-neutral-400 text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Episodes per season */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-neutral-400">الحلقات لكل موسم</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomEpisodesCount(Math.max(1, customEpisodesCount - 1))}
                            className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center bg-black/40 hover:bg-neutral-900 text-neutral-400 text-xs font-bold cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-black font-mono w-10 text-center text-white">{customEpisodesCount}</span>
                          <button
                            type="button"
                            onClick={() => setCustomEpisodesCount(customEpisodesCount + 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center bg-black/40 hover:bg-neutral-900 text-neutral-400 text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2.5 mt-4 border-t border-neutral-900/30 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-3 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ التعديلات الجديدة</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold transition-all active:scale-97 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard View */
                <>
                  {/* Category & Title */}
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${textSub}`}>
                      {item.category === "anime" ? "أنمي" : item.category === "series" ? "مسلسل تلفزيوني" : "فيلم"}
                    </span>
                    <h2 className={`text-xl md:text-2xl font-bold mt-1 leading-tight ${textTitle}`}>
                      {item.title.split("|")[0].trim()}
                    </h2>
                    {item.originalTitle && item.originalTitle !== item.title.split("|")[0].trim() && (
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.originalTitle}</p>
                    )}
                  </div>

                  {/* Badges/Metadata */}
                  <div className={`flex flex-wrap gap-x-4 gap-y-2 text-xs border-b pb-3 font-medium ${theme === "minimal" ? "border-neutral-200" : "border-neutral-900/60"} ${textSub}`}>
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
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{item.rating.toFixed(1)} / 10</span>
                      </div>
                    )}
                  </div>

                  {/* Overview / Story Description */}
                  {item.overview && (
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-xs font-semibold ${textSub}`}>القصة</span>
                      <p className={`text-xs md:text-sm leading-relaxed max-w-2xl ${textMain}`}>
                        {item.overview}
                      </p>
                    </div>
                  )}

                  {/* Genres tags */}
                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.genres.map((g, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${theme === "minimal" ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-neutral-900 text-neutral-400 border-neutral-800/30"}`}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Movie Action / TV Checklist */}
                  {item.type === "movie" ? (
                    <div className={`mt-4 pt-4 border-t ${theme === "minimal" ? "border-neutral-200" : "border-neutral-900/40"}`}>
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
                    <div className={`mt-4 pt-4 border-t ${theme === "minimal" ? "border-neutral-200" : "border-neutral-900/40"}`}>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className={`font-semibold text-sm ${textTitle}`}>تتبع الحلقات الذكي</h3>
                          <p className="text-[10px] text-neutral-500">الحلقات منسقة كـ قائمة مهام شخصية لإنجازها</p>
                        </div>

                        {/* Season Dropdown Selector */}
                        {item.totalSeasons && item.totalSeasons > 0 && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${textSub}`}>الموسم:</span>
                            <select
                              value={selectedSeasonNum}
                              onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                              className={`text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none ${
                                theme === "minimal" 
                                  ? "bg-neutral-50 text-neutral-800 border-neutral-200" 
                                  : "bg-[#0c0c0f] text-neutral-200 border-neutral-800/60"
                              }`}
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
                      <div className={`rounded-xl border p-1 overflow-hidden max-h-[300px] overflow-y-auto transition-all ${getSectionBg()}`}>
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
                          <div className={`divide-y ${theme === "minimal" ? "divide-neutral-100" : "divide-neutral-900/40"}`}>
                            {activeSeason.episodes.map((ep) => (
                              <label
                                key={ep.episodeNumber}
                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-500/5 transition-all duration-200 group ${
                                  ep.completed ? "opacity-60" : "opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span className="text-xs font-mono text-neutral-500 w-4 shrink-0">
                                    {ep.episodeNumber}
                                  </span>
                                  <span className={`text-xs md:text-sm font-medium truncate ${
                                    ep.completed ? "line-through text-neutral-500" : textTitle
                                  }`}>
                                    {ep.name}
                                  </span>
                                </div>

                                {/* Accessible screen reader input + custom premium motion.div checkmark */}
                                <input
                                  type="checkbox"
                                  checked={ep.completed}
                                  onChange={(e) => {
                                    handleEpisodeToggle(ep.episodeNumber, e.target.checked);
                                    if (navigator.vibrate) {
                                      try { navigator.vibrate(10); } catch(err) {}
                                    }
                                  }}
                                  className="sr-only"
                                />
                                
                                <motion.div
                                  animate={{
                                    scale: ep.completed ? [1, 1.15, 1] : 1,
                                    backgroundColor: ep.completed 
                                      ? (theme === "netflix" ? "#f59e0b" : theme === "material" ? "#14b8a6" : theme === "minimal" ? "#171717" : "#ffffff") 
                                      : "transparent"
                                  }}
                                  transition={{
                                    scale: { type: "keyframes", duration: 0.2 },
                                    backgroundColor: { type: "spring", stiffness: 400, damping: 25 }
                                  }}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    ep.completed 
                                      ? "border-transparent" 
                                      : (theme === "minimal" ? "border-neutral-300" : "border-neutral-700")
                                  }`}
                                >
                                  {ep.completed && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className={`text-[10px] font-bold ${
                                        theme === "minimal" || theme === "netflix" ? "text-white" : "text-neutral-950"
                                      }`}
                                    >
                                      ✓
                                    </motion.span>
                                  )}
                                </motion.div>
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
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
