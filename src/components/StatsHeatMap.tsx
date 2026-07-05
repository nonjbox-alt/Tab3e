import React from "react";
import { ThemeType } from "../types";

interface StatsHeatMapProps {
  theme: ThemeType;
  activityData: { [dateStr: string]: number }; // e.g. { "2026-07-05": 3 }
}

export const StatsHeatMap: React.FC<StatsHeatMapProps> = ({ theme, activityData }) => {
  // Generate last 12 weeks of dates
  const weeksCount = 16;
  const daysInWeek = 7;
  const totalDays = weeksCount * daysInWeek;
  
  const now = new Date();
  const datesGrid: Date[][] = [];

  // Get start date (16 weeks ago, aligned to Sunday)
  const startDate = new Date();
  startDate.setDate(now.getDate() - totalDays + 1);
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay); // align to Sunday

  // Group into 16 columns (weeks) of 7 rows (days)
  for (let w = 0; w < weeksCount; w++) {
    const week: Date[] = [];
    for (let d = 0; d < daysInWeek; d++) {
      const cellDate = new Date(startDate.getTime());
      cellDate.setDate(startDate.getDate() + (w * 7 + d));
      week.push(cellDate);
    }
    datesGrid.push(week);
  }

  // Get color intensity class based on activity count and theme
  const getCellColor = (count: number) => {
    if (count === 0) {
      return theme === "minimal"
        ? "bg-neutral-100 border border-neutral-200/50"
        : "bg-neutral-900/80 border border-neutral-950/20";
    }

    if (theme === "netflix") {
      if (count === 1) return "bg-amber-950 text-amber-200 border border-amber-900/20";
      if (count === 2) return "bg-amber-800 text-amber-100";
      if (count === 3) return "bg-amber-500 text-amber-950 font-bold";
      return "bg-amber-400 text-neutral-950 font-bold";
    }

    if (theme === "material") {
      if (count === 1) return "bg-zinc-800 text-zinc-300 border border-zinc-700/20";
      if (count === 2) return "bg-zinc-600 text-zinc-100";
      if (count === 3) return "bg-zinc-400 text-zinc-900";
      return "bg-zinc-200 text-neutral-900";
    }

    if (theme === "minimal") {
      if (count === 1) return "bg-neutral-200";
      if (count === 2) return "bg-neutral-400";
      if (count === 3) return "bg-neutral-600 text-white";
      return "bg-neutral-950 text-white";
    }

    // Default: OLED Black (White / Gray accents)
    if (count === 1) return "bg-neutral-800 text-neutral-100 border border-neutral-700/30";
    if (count === 2) return "bg-neutral-600 text-neutral-100";
    if (count === 3) return "bg-neutral-400 text-neutral-950";
    return "bg-neutral-100 text-black";
  };

  const dayLabels = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const getContainerBg = () => {
    if (theme === "minimal") return "bg-white border-neutral-200/80 shadow-sm text-neutral-900";
    if (theme === "netflix") return "bg-[#11100c]/50 border-amber-950/20 text-amber-100";
    if (theme === "material") return "bg-[#18181c]/50 border-zinc-900/40 text-zinc-100";
    return "bg-[#0b0b0e]/50 border-neutral-900/40 text-neutral-100"; // OLED Black
  };

  const getHeadingColor = () => {
    if (theme === "minimal") return "text-neutral-800";
    return "text-neutral-200";
  };

  return (
    <div className={`w-full p-4 md:p-6 rounded-2xl border transition-all duration-300 ${getContainerBg()}`} id="stats-heatmap-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-semibold text-sm md:text-base ${getHeadingColor()}`}>خريطة الإنجاز والنشاط</h3>
          <p className="text-xs text-neutral-500">معدل تتبعك للمشاهدة اليومية خلال آخر 16 أسبوعاً</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span>أقل</span>
          <div className={`w-2.5 h-2.5 rounded ${theme === "minimal" ? "bg-neutral-100 border border-neutral-200" : "bg-neutral-900 border border-neutral-800"}`}></div>
          <div className="w-2.5 h-2.5 rounded bg-neutral-600"></div>
          <div className="w-2.5 h-2.5 rounded bg-neutral-400"></div>
          <div className={`w-2.5 h-2.5 rounded ${theme === "minimal" ? "bg-neutral-950" : "bg-white"}`}></div>
          <span>أكثر</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" dir="rtl">
        {/* Day labels column */}
        <div className="flex flex-col justify-between text-[10px] text-neutral-500 pr-1 py-1 h-[105px] select-none shrink-0">
          {dayLabels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>

        {/* Grid Column */}
        <div className="flex gap-1 py-1 shrink-0">
          {datesGrid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((date, dIdx) => {
                const dateStr = date.toISOString().split("T")[0];
                const count = activityData[dateStr] || 0;
                const formattedDate = date.toLocaleDateString("ar-EG", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={dIdx}
                    title={`${formattedDate}: تم إنجاز ${count} حلقة / عمل`}
                    className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer ${getCellColor(
                      count
                    )}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
