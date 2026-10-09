import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  FileSpreadsheet,
  FileCode,
  FolderOpen,
  Filter,
  ArrowUpDown,
  X
} from 'lucide-react';
import { ApiCategory, ApiTransaction, Language, TransactionType } from '../../types';
import {
  formatCurrency,
  formatDateTimeLocale,
  getCategoryDisplayName,
  getCategoryColor,
  getTodayDateString,
} from '../../utils/format';
import { CategoryIcon } from '../common/CategoryIcon';
import { translations } from '../../i18n/translations';

interface TransactionListProps {
  transactions: ApiTransaction[];
  categories: ApiCategory[];
  currency: string;
  lang: Language;
  onEdit: (tx: ApiTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenAddModal: (type?: TransactionType) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  currency,
  lang,
  onEdit,
  onDelete,
  onOpenAddModal,
  onExportCSV,
  onExportJSON,
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, ApiCategory>();
    categories.forEach((c) => map.set(c.pkey, c));
    return map;
  }, [categories]);

  // Filtering and sorting
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayDateString();

    return transactions
      .filter((tx) => {
        // 1. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const descMatch = (tx.description || '').toLowerCase().includes(q);
          const amountMatch = (tx.amount || '').toString().includes(q);
          const cat = categoriesMap.get(tx.categoryId);
          const catName = cat ? getCategoryDisplayName(cat, lang).toLowerCase() : '';
          const catMatch = catName.includes(q);
          if (!descMatch && !amountMatch && !catMatch) return false;
        }

        // 2. Type
        if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
          return false;
        }

        // 3. Category
        if (categoryFilter !== 'ALL' && tx.categoryId !== categoryFilter) {
          return false;
        }

        // 4. Period
        if (periodFilter === 'today') {
          return tx.transactionDate?.startsWith(todayStr);
        } else if (periodFilter === 'week') {
          if (!tx.transactionDate) return false;
          const d = new Date(tx.transactionDate);
          const diffTime = Math.abs(now.getTime() - d.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        } else if (periodFilter === 'month') {
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          return tx.transactionDate?.startsWith(currentMonth);
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.transactionDate || 0).getTime();
        const timeB = new Date(b.transactionDate || 0).getTime();
        if (sortBy === 'date_desc') return timeB - timeA;
        if (sortBy === 'date_asc') return timeA - timeB;
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchQuery, typeFilter, categoryFilter, periodFilter, sortBy, categoriesMap, lang]);

  const filteredIncome = filteredTransactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const filteredExpense = filteredTransactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search & Mobile Action Row */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 sm:pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export buttons on Desktop, compact icon on mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onExportCSV}
              className="p-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1 cursor-pointer"
              title={t.exportExcel}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">{t.exportExcel}</span>
            </button>
            <button
              onClick={onExportJSON}
              className="p-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1 cursor-pointer"
              title={t.backupJson}
            >
              <FileCode className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{t.backupJson}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Swipeable Filter Chips (Mobile-First Touch Ergonomics) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {/* Type Chips */}
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              typeFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.allTypes}
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            -{t.expensesOnly}
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              typeFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            +{t.incomesOnly}
          </button>

          <span className="h-4 w-px bg-slate-200 shrink-0 mx-0.5" />

          {/* Period selector */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="all">{t.allPeriods}</option>
            <option value="today">{t.today}</option>
            <option value="week">{t.last7Days}</option>
            <option value="month">{t.thisMonthFilter}</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none max-w-[130px] truncate cursor-pointer shrink-0"
          >
            <option value="ALL">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.pkey} value={c.pkey}>
                {getCategoryDisplayName(c, lang)}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="date_desc">{t.sortDateDesc}</option>
            <option value="date_asc">{t.sortDateAsc}</option>
            <option value="amount_desc">{t.sortAmountDesc}</option>
            <option value="amount_asc">{t.sortAmountAsc}</option>
          </select>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
          <span>
            {t.foundCount}: <b className="text-slate-700 font-bold">{filteredTransactions.length}</b> {t.operations}
          </span>
          <div className="flex items-center gap-2.5 font-mono text-[10px] sm:text-[11px]">
            <span className="text-emerald-600 font-bold">
              +{formatCurrency(filteredIncome, currency, lang)}
            </span>
            <span className="text-rose-600 font-bold">
              -{formatCurrency(filteredExpense, currency, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{t.noTransactionsFound}</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {t.noTransactionsHint}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenAddModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addTransaction}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const cat = categoriesMap.get(tx.categoryId);
              const catName = getCategoryDisplayName(cat, lang);
              const isExpense = tx.type === 'EXPENSE';
              const color = getCategoryColor(tx.categoryId);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/90 active:bg-slate-100/70 transition flex items-center justify-between gap-2.5 group"
                >
                  {/* Left: Category Icon & Full Description */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs"
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                        borderColor: `${color}30`,
                      }}
                    >
                      <CategoryIcon name={catName} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Prominent Description */}
                      <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words">
                        {tx.description}
                      </div>

                      {/* Subtitle: Category badge, clear Date & Time */}
                      {(() => {
                        const { date: txDate, time: txTime } = formatDateTimeLocale(tx.transactionDate, lang);
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] sm:text-xs">
                            <span
                              className="font-semibold px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]"
                              style={{
                                backgroundColor: `${color}15`,
                                color: color,
                              }}
                            >
                              {catName}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-slate-600 font-medium text-[10px] sm:text-xs">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{txDate}</span>
                            </span>
                            {txTime && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px]">
                                  <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span>{txTime}</span>
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right: Amount & Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold tracking-tight font-mono ${
                          isExpense ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(tx.amount, currency, lang)}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded inline-block ${
                          isExpense ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isExpense ? t.expense : t.income}
                      </span>
                    </div>

                    {/* Action buttons (always visible on mobile with subtle style) */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
