import React from 'react';
import {
  X,
  Mail,
  Calendar,
  ShieldCheck,
  Key,
  Clock,
  LogOut,
  Trash2,
  CheckCircle,
  Hash
} from 'lucide-react';
import { UserInfo, Language } from '../../types';
import { formatDateLocale } from '../../utils/format';
import { translations } from '../../i18n/translations';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInfo;
  lang: Language;
  onLogout: () => void;
  onClearAllData: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  lang,
  onLogout,
  onClearAllData,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250">
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-extrabold border border-white/20 shadow-inner">
              {user.fullName ? user.fullName.charAt(0) : user.username?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{user.fullName || user.username}</h3>
              <p className="text-xs text-indigo-200">@{user.username}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {user.role === 'ADMIN' ? t.admin : t.user}
                </span>
                {user.enabled && (
                  <span className="bg-white/20 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-300" /> {t.active}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {t.email}:
              </span>
              <span className="font-semibold text-slate-800 select-all">{user.email}</span>
            </div>

            {user.birthdate && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {t.birthdate}:
                </span>
                <span className="font-semibold text-slate-800">{formatDateLocale(user.birthdate, lang, false)}</span>
              </div>
            )}

            {user.pkey && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  {t.userId}:
                </span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[170px]" title={user.pkey}>
                  {user.pkey}
                </span>
              </div>
            )}

            {user.authorities && user.authorities.length > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  {t.permissions}:
                </span>
                <div className="flex gap-1">
                  {user.authorities.map((a, i) => (
                    <span key={i} className="bg-slate-200 text-slate-800 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {a.authority}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.createdAt && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {t.memberSince}:
                </span>
                <span className="text-slate-700">{formatDateLocale(user.createdAt, lang)}</span>
              </div>
            )}
          </div>

          {/* Data Controls */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t.dataSettings}
            </span>

            <button
              type="button"
              onClick={() => {
                if (confirm(t.confirmClear)) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearAllData}</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-2">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
