import React from "react";
import { Home, Compass, Search, Sliders, PlaySquare } from "lucide-react";
import { ThemeType } from "../types";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  theme: ThemeType;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  title,
  theme,
}) => {
  const navItems = [
    { id: "home", label: "الرئيسية", icon: Home },
    { id: "library", label: "مكتبتي", icon: PlaySquare },
    { id: "journey", label: "رحلتي", icon: Compass },
    { id: "search", label: "البحث", icon: Search },
    { id: "settings", label: "الإعدادات", icon: Sliders },
  ];

  // Get Sidebar Background based on theme
  const getSidebarBg = () => {
    if (theme === "minimal") return "bg-white border-neutral-200/80 text-neutral-900";
    if (theme === "netflix") return "bg-[#0d0c09] border-amber-950/20 text-amber-100";
    if (theme === "material") return "bg-[#16161a] border-zinc-900/40 text-zinc-100";
    return "bg-[#050507] border-neutral-900/60 text-neutral-100"; // OLED Black
  };

  // Get Tab Active/Inactive classes
  const getNavActiveStyle = (isActive: boolean) => {
    if (!isActive) {
      if (theme === "minimal") return "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50";
      if (theme === "netflix") return "text-amber-500/50 hover:text-amber-200 hover:bg-amber-950/10";
      if (theme === "material") return "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20";
      return "text-neutral-500 hover:text-neutral-100 hover:bg-white/[0.02]";
    }

    if (theme === "minimal") {
      return "bg-neutral-100 text-neutral-950 border-r-2 border-neutral-900 font-bold shadow-sm";
    }
    if (theme === "netflix") {
      return "bg-amber-950/25 text-amber-400 border-r-2 border-amber-400 font-bold";
    }
    if (theme === "material") {
      return "bg-zinc-900/35 text-zinc-200 border-r-2 border-zinc-400 font-bold";
    }
    return "bg-white/5 text-white border-r-2 border-white font-bold";
  };

  // Mobile Bottom Nav Background based on theme
  const getMobileNavBg = () => {
    if (theme === "minimal") return "bg-white/95 border-neutral-200/80 shadow-lg";
    if (theme === "netflix") return "bg-[#0d0c09]/95 border-amber-950/20";
    if (theme === "material") return "bg-[#16161a]/95 border-zinc-900/40";
    return "bg-[#050507]/95 border-neutral-900/60";
  };

  const getMobileItemStyle = (isActive: boolean) => {
    if (isActive) {
      if (theme === "minimal") return "text-neutral-950 scale-105";
      if (theme === "netflix") return "text-amber-400 scale-105";
      if (theme === "material") return "text-zinc-200 scale-105";
      return "text-white scale-105";
    }
    if (theme === "minimal") return "text-neutral-400 hover:text-neutral-600";
    if (theme === "netflix") return "text-amber-600/50 hover:text-amber-400";
    if (theme === "material") return "text-zinc-500 hover:text-zinc-300";
    return "text-neutral-500 hover:text-neutral-300";
  };

  const getActiveDotColor = () => {
    if (theme === "minimal") return "bg-neutral-950";
    if (theme === "netflix") return "bg-amber-400";
    if (theme === "material") return "bg-zinc-300";
    return "bg-white";
  };

  return (
    <>
      {/* Sidebar for Desktop & Tablet */}
      <aside 
        className={`hidden md:flex flex-col w-64 h-screen fixed right-0 top-0 border-l p-6 justify-between z-30 transition-all duration-300 ${getSidebarBg()}`}
        id="desktop-sidebar"
        dir="rtl"
      >
        <div className="flex flex-col gap-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
              theme === "minimal" 
                ? "bg-neutral-900 text-white border-neutral-800" 
                : "bg-white/10 border-white/10"
            }`}>
              <span className={`font-extrabold text-sm tracking-wider ${theme === "minimal" ? "text-white" : "text-white"}`}>WV</span>
            </div>
            <div>
              <h1 className={`font-bold text-lg leading-none tracking-tight ${theme === "minimal" ? "text-neutral-900" : "text-white"}`}>WatchVault</h1>
              <span className="text-[10px] text-neutral-500 font-medium">مهمات المشاهدة الذكية</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${getNavActiveStyle(isActive)}`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "" : "opacity-80"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`px-2 py-4 border-t ${theme === "minimal" ? "border-neutral-100" : "border-neutral-900/40"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
              theme === "minimal" ? "bg-neutral-100 text-neutral-600" : "bg-neutral-800 text-neutral-400"
            }`}>
              U
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-semibold truncate ${theme === "minimal" ? "text-neutral-800" : "text-neutral-200"}`}>المستخدم الشخصي</span>
              <span className="text-[9px] text-neutral-500 truncate">وضع عدم الاتصال نشط</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav 
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-md border-t flex justify-around items-center px-4 pb-safe z-30 transition-all duration-300 ${getMobileNavBg()}`}
        id="mobile-bottom-nav"
        dir="rtl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 relative group"
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-200 ${getMobileItemStyle(isActive)}`} 
              />
              <span 
                className={`text-[9px] mt-1 transition-all duration-200 font-medium ${
                  isActive ? "opacity-100 scale-100 font-bold" : "opacity-60"
                } ${getMobileItemStyle(isActive)}`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className={`absolute top-1 right-3.5 w-1 h-1 rounded-full ${getActiveDotColor()}`}></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
