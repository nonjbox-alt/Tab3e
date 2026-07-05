import React from "react";
import { Home, Compass, Search, Sliders, PlaySquare } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  title,
}) => {
  const navItems = [
    { id: "home", label: "الرئيسية", icon: Home },
    { id: "library", label: "مكتبتي", icon: PlaySquare },
    { id: "journey", label: "رحلتي", icon: Compass },
    { id: "search", label: "البحث", icon: Search },
    { id: "settings", label: "الإعدادات", icon: Sliders },
  ];

  return (
    <>
      {/* Sidebar for Desktop & Tablet */}
      <aside 
        className="hidden md:flex flex-col w-64 h-screen fixed right-0 top-0 bg-[#060608] border-l border-neutral-900/60 p-6 justify-between z-30"
        id="desktop-sidebar"
        dir="rtl"
      >
        <div className="flex flex-col gap-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 shadow-lg shadow-white/5">
              <span className="font-extrabold text-sm tracking-wider text-white">WV</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none tracking-tight">WatchVault</h1>
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
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                    isActive
                      ? "bg-white/5 text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)] border-r-2 border-white"
                      : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-2 py-4 border-t border-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
              U
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-neutral-200 truncate">المستخدم الشخصي</span>
              <span className="text-[9px] text-neutral-500 truncate">وضع عدم الاتصال نشط</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#060608]/95 backdrop-blur-md border-t border-neutral-900/60 flex justify-around items-center px-4 pb-safe z-30"
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
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 relative group"
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? "text-white scale-110" : "text-neutral-500"
                }`} 
              />
              <span 
                className={`text-[9px] mt-1 transition-all duration-300 font-medium ${
                  isActive ? "text-white opacity-100 scale-100" : "text-neutral-500 opacity-60"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-1 right-3.5 w-1 h-1 bg-white rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
