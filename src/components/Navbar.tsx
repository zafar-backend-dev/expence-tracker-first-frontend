import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wallet,
  Plus,
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  LogOut,
  ShieldCheck,
  Globe,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { UserInfo, Language } from '../types';
import { translations } from '../i18n/translations';

interface NavbarProps {
  user: UserInfo;
  onOpenAddModal: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAddModal,
  onOpenProfile,
  onLogout,
  lang,
  setLang,
}) => {
  const t = translations[lang];

  return (
    <>
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile Left: User Avatar + Name (tap opens profile) */}
            <div className="flex items-center gap-2.5 sm:hidden">
              <button
                onClick={onOpenProfile}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm active:scale-95 transition cursor-pointer"
                aria-label={t.profile}
              >
                {user.fullName ? user.fullName.charAt(0) : user.username?.charAt(0) || 'U'}
              </button>
              <div className="text-left" onClick={onOpenProfile}>
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {user.role === 'ADMIN' ? '👑 Admin' : t.user}
                </div>
              </div>
            </div>

            {/* Desktop Brand Logo */}
            <NavLink to="/dashboard" className="hidden sm:flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-lg">{t.appName}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                    {lang === 'tr' ? 'Bütçe' : 'Finance'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  {t.appTagline}
                </p>
              </div>
            </NavLink>

            {/* Central Navigation (Desktop only) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.dashboard}</span>
              </NavLink>
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <Receipt className="w-4 h-4" />
                <span>{t.transactions}</span>
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <PieChart className="w-4 h-4" />
                <span>{t.analytics}</span>
              </NavLink>
              <NavLink
                to="/budgets"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                <Target className="w-4 h-4" />
                <span>{t.budgets}</span>
              </NavLink>
            </nav>

            {/* Right Controls: Currency Badge, Language Select, Quick Add, Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Turkish Lira Badge */}
              <div className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] sm:text-xs font-bold text-indigo-900 select-none shadow-2xs">
                <span className="text-indigo-600 font-extrabold text-xs sm:text-sm leading-none">₺</span>
                <span>TRY</span>
              </div>

              {/* Styled Language Select Dropdown */}
              <div className="relative flex items-center bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 transition shadow-2xs group cursor-pointer">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 mr-1 shrink-0" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Language)}
                  aria-label={t.language}
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-3.5 appearance-none"
                >
                  <option value="en">🇬🇧 EN</option>
                  <option value="tr">🇹🇷 TR</option>
                </select>
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 absolute right-1.5 pointer-events-none group-hover:text-slate-600 transition" />
              </div>

              {/* Desktop Quick Add Button */}
              <button
                onClick={onOpenAddModal}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-200 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t.quickAdd}</span>
              </button>

              {/* Desktop Profile Button */}
              <button
                onClick={onOpenProfile}
                className="hidden sm:flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-left cursor-pointer"
                title={t.profile}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                  {user.fullName ? user.fullName.charAt(0) : user.username?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[100px]">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    {user.role === 'ADMIN' ? (
                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> {t.admin}
                      </span>
                    ) : (
                      <span>{t.user}</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. NATIVE MOBILE BOTTOM TAB BAR (fixed at bottom of phone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5 relative">
          {/* Dashboard Tab */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{t.dashboard}</span>
          </NavLink>

          {/* Transactions Tab */}
          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            <Receipt className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{t.transactions}</span>
          </NavLink>

          {/* Floating Center Action Button (+) for Mobile Thumb Ergonomics */}
          <div className="flex items-center justify-center -mt-6">
            <button
              onClick={onOpenAddModal}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 active:scale-90 transition-transform cursor-pointer border-4 border-white"
              aria-label={t.addTransaction}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Analytics Tab */}
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            <PieChart className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{t.analytics}</span>
          </NavLink>

          {/* Budgets Tab */}
          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`
            }
          >
            <Target className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{t.budgets}</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};
