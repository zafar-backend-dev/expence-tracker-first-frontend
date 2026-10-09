import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  FolderOpen,
  Calendar,
  Clock
} from 'lucide-react';
import { ApiCategory, ApiTransaction, Language, TransactionType } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  getCategoryDisplayName,
  getCategoryDescription,
  getCategoryColor,
  parseDateParts,
  getTodayDateString,
  getCurrentTimeString,
} from '../../utils/format';
import { translations } from '../../i18n/translations';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: {
      amount: number;
      description: string;
      type: TransactionType;
      transactionDate: string;
      categoryId: string;
    },
    idToEdit?: string
  ) => Promise<void>;
  editTransaction?: ApiTransaction | null;
  initialType?: TransactionType;
  categories: ApiCategory[];
  currency: string;
  lang: Language;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTransaction,
  initialType = 'EXPENSE',
  categories,
  currency,
  lang,
}) => {
  const t = translations[lang];

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setDescription(editTransaction.description || '');
      setCategoryId(editTransaction.categoryId || (categories[0]?.pkey || ''));
      if (editTransaction.transactionDate) {
        const parts = parseDateParts(editTransaction.transactionDate);
        if (parts) {
          setDate(parts.dateString);
          setTime(parts.timeString);
        } else {
          setDate(getTodayDateString());
          setTime(getCurrentTimeString());
        }
      } else {
        setDate(getTodayDateString());
        setTime(getCurrentTimeString());
      }
    } else {
      setType(initialType);
      setAmount('');
      setDescription('');
      setCategoryId(categories[0]?.pkey || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setCategorySearch('');
    }
  }, [editTransaction, initialType, isOpen, categories]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.toLowerCase();
    const name = (lang === 'tr' ? c.nameTr : c.nameEn) || c.nameEn || c.nameTr || '';
    const desc = (lang === 'tr' ? c.descriptionTr : c.descriptionEn) || '';
    return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  const handleQuickAddAmount = (val: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const chosenCat = categoryId || categories[0]?.pkey || '';
    
    // Construct exact ISO timestamp preserving the exact date and time entered by user
    // e.g. "2026-10-09T18:15:00.000Z" (no 3-hour shift/subtraction)
    const safeDate = date || getTodayDateString();
    let safeHours = '12';
    let safeMinutes = '00';
    if (time) {
      const [h, m] = time.split(':');
      safeHours = String(h || '00').padStart(2, '0');
      safeMinutes = String(m || '00').padStart(2, '0');
    } else {
      const cur = getCurrentTimeString();
      const [h, m] = cur.split(':');
      safeHours = h;
      safeMinutes = m;
    }

    const isoDate = `${safeDate}T${safeHours}:${safeMinutes}:00.000Z`;

    setSaving(true);
    try {
      await onSave(
        {
          amount: numAmount,
          description: description.trim() || (type === 'INCOME' ? t.income : t.expense),
          type,
          transactionDate: isoDate,
          categoryId: chosenCat,
        },
        editTransaction?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250">
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <span className="font-bold text-slate-800 text-sm sm:text-base">
            {editTransaction ? t.editTransaction : t.newTransaction}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.expenseTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t.incomeTab}</span>
            </button>
          </div>

          {/* Amount Input with big numeric font */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.amount} (₺)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full pl-4 pr-12 py-3 text-3xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">
                ₺
              </span>
            </div>

            {/* Quick add amount buttons */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => handleQuickAddAmount(20)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                +20 ₺
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddAmount(50)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                +50 ₺
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddAmount(100)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                +100 ₺
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddAmount(500)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
              >
                +500 ₺
              </button>
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.description}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Category selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t.category}
              </label>
              {categories.length > 5 && (
                <div className="relative w-32">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder={t.searchCategories}
                    className="w-full pl-6 pr-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                  <FolderOpen className="w-4 h-4" />
                  <span>{t.noTransactionsFound}</span>
                </div>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const isSelected = categoryId === cat.pkey;
                  const name = getCategoryDisplayName(cat, lang);
                  const color = getCategoryColor(idx);

                  return (
                    <button
                      type="button"
                      key={cat.pkey}
                      onClick={() => setCategoryId(cat.pkey)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-2xs font-bold'
                          : 'bg-white/80 border-slate-200/80 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}15`, color: color }}
                      >
                        <CategoryIcon name={name} className="w-4 h-4" />
                      </div>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.date}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.time}</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition font-mono font-semibold"
              />
            </div>
          </div>

          {/* Action buttons (Full width on mobile) */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-2 py-3 rounded-xl text-xs sm:text-sm font-black text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? t.loading : editTransaction ? t.save : t.create}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
