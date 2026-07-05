import React from "react";
import { motion } from "motion/react";
import { TrackedItem, ThemeType } from "../types";
import { Star, CheckCircle2, Clock, Play } from "lucide-react";

interface TrackedCardProps {
  item: TrackedItem;
  theme: ThemeType;
  posterWallMode?: boolean;
  onClick: () => void;
}

export const TrackedCard: React.FC<TrackedCardProps> = ({
  item,
  theme,
  posterWallMode = false,
  onClick,
}) => {
  // Compute progress percentage
  const getProgressInfo = () => {
    if (item.status === "completed") {
      return { percent: 100, label: "✓ مكتمل", episodesText: item.type === "movie" ? "فيلم" : "كل الحلقات" };
    }
    
    if (item.type === "movie") {
      return item.status === "watching" 
        ? { percent: 50, label: "قيد المشاهدة", episodesText: "فيلم" }
        : { percent: 0, label: "للمشاهدة لاحقاً", episodesText: "فيلم" };
    }

    // Series/Anime progress calculation
    if (!item.seasons || item.seasons.length === 0) {
      return { percent: 0, label: "جاري التتبع", episodesText: "بدون حلقات" };
    }

    let totalEpisodes = 0;
    let completedEpisodes = 0;

    item.seasons.forEach((season) => {
      totalEpisodes += season.episodeCount;
      season.episodes.forEach((episode) => {
        if (episode.completed) {
          completedEpisodes++;
        }
      });
    });

    const percent = totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    return {
      percent,
      label: `${percent}% متبقي حلقة`,
      episodesText: `الموسم ${item.currentSeason || 1} • ${completedEpisodes} / ${totalEpisodes} حلقة`,
    };
  };

  const { percent, episodesText } = getProgressInfo();

  // Highlight color based on theme
  const getProgressColor = () => {
    if (theme === "netflix") return "bg-amber-400";
    if (theme === "material") return "bg-teal-500";
    if (theme === "minimal") return "bg-neutral-300";
    return "bg-neutral-200"; // OLED black default
  };

  const getStatusIcon = () => {
    if (item.status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (item.status === "watching") return <Play className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Clock className="w-4 h-4 text-neutral-500 shrink-0" />;
  };

  const posterUrl = item.posterPath
    ? item.posterPath.startsWith("http")
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w500${item.posterPath}`
    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop";

  if (posterWallMode) {
    // Wall Mode: Render ONLY the clean poster. No title, no progress on card.
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden cursor-pointer shadow-lg shadow-black/40 hover:shadow-black/70 group"
      >
        <img
          src={posterUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle hover overlay for interactiveness */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800 flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white">{item.title.split("|")[0].trim()}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const getCardBgClass = () => {
    if (theme === "minimal") {
      return "bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-900 shadow-sm hover:shadow-md";
    }
    if (theme === "netflix") {
      return "bg-[#11100c] hover:bg-[#181712] border-amber-950/20 text-amber-100";
    }
    if (theme === "material") {
      return "bg-[#18181c] hover:bg-[#202026] border-zinc-900/60 text-zinc-100";
    }
    return "bg-[#0b0b0e] hover:bg-[#121217] border-neutral-900/40 text-neutral-100"; // OLED black default
  };

  const getTitleColorClass = () => {
    if (theme === "minimal") return "text-neutral-900 group-hover:text-black";
    if (theme === "netflix") return "text-amber-50 group-hover:text-amber-200";
    if (theme === "material") return "text-zinc-100 group-hover:text-white";
    return "text-neutral-100 group-hover:text-white";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-2xl p-3 cursor-pointer transition-colors duration-300 border flex flex-col h-full group ${getCardBgClass()}`}
    >
      {/* Pristine Poster */}
      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-sm bg-neutral-950 shrink-0 relative">
        <img
          src={posterUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
      </div>

      {/* Details underneath the poster - Poster remains perfectly clean! */}
      <div className="mt-3 flex flex-col flex-grow justify-between gap-2.5 px-0.5">
        <div className="flex flex-col gap-1">
          {/* Title and Category */}
          <div className="flex items-start justify-between gap-1">
            <h4 className={`font-semibold text-xs md:text-sm line-clamp-1 transition-colors duration-200 ${getTitleColorClass()}`}>
              {item.title.split("|")[0].trim()}
            </h4>
            {item.favorite && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            )}
          </div>
          
          <div className={`flex items-center gap-1.5 text-[10px] ${theme === "minimal" ? "text-neutral-500" : "text-neutral-500"}`}>
            {getStatusIcon()}
            <span>
              {item.category === "anime" ? "أنمي" : item.category === "series" ? "مسلسل" : "فيلم"}
            </span>
            <span>•</span>
            <span>{item.releaseDate ? item.releaseDate.split("-")[0] : "مستمر"}</span>
          </div>
        </div>

        {/* Progress bar and episode numbers below name */}
        <div className="flex flex-col gap-1.5 mt-auto">
          {/* Custom micro progress bar */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === "minimal" ? "bg-neutral-100" : "bg-neutral-900"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          
          <div className={`flex items-center justify-between text-[10px] font-medium ${theme === "minimal" ? "text-neutral-500" : "text-neutral-400"}`}>
            <span>{episodesText}</span>
            <span className={`text-[9px] ${theme === "minimal" ? "text-neutral-400" : "text-neutral-500"}`}>{percent}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
