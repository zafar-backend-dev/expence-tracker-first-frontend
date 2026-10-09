import React, { useState } from 'react';
import {
  Target,
  Edit2,
  Check,
  ShieldAlert
} from 'lucide-react';
import { ApiCategory, ApiTransaction, CategoryBudget, Language } from '../../types';
import { formatCurrency, getCategoryDisplayName, getCategoryColor } from '../../utils/format';
import { CategoryIcon } from '../common/CategoryIcon';
import { translations } from '../../i18n/translations';

interface BudgetViewProps {
  budgets: CategoryBudget[];
  categories: ApiCategory[];
  transactions: ApiTransaction[];
  currency: string;
  lang: Language;
  onSaveBudgets: (newBudgets: CategoryBudget[]) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  categories,
  transactions,
  currency,
  lang,
  onSaveBudgets,
}) => {
  const t = translations[lang];

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  // This month's expenses
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthExpenses = transactions.filter(
    (tx) => tx.type === 'EXPENSE' && tx.transactionDate?.startsWith(currentMonthStr)
  );

  const expenseByCategory: Record<string, number> = {};
  thisMonthExpenses.forEach((tx) => {
    expenseByCategory[tx.categoryId] =
      (expenseByCategory[tx.categoryId] || 0) + Number(tx.amount || 0);
  });

  const handleStartEdit = (catId: string, currentLimit: number) => {
    setEditingCatId(catId);
    setEditLimitValue(currentLimit.toString());
  };

  const handleSaveEdit = (catId: string) => {
    const val = parseFloat(editLimitValue);
    if (isNaN(val) || val < 0) return;

    const existing = budgets.find((b) => b.categoryId === catId);
    let updated: CategoryBudget[];
    if (existing) {
      updated = budgets.map((b) => (b.categoryId === catId ? { ...b, monthlyLimit: val } : b));
    } else {
      updated = [...budgets, { categoryId: catId, monthlyLimit: val }];
    }
    onSaveBudgets(updated);
    setEditingCatId(null);
  };

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
  const totalSpentInBudgetedCats = budgets.reduce(
    (sum, b) => sum + (expenseByCategory[b.categoryId] || 0),
    0
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top summary card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold mb-0.5">
              <Target className="w-4 h-4" />
              <span>{t.budgetTitle}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {t.budgetSubtitle}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">
                {t.totalPlanned}
              </span>
              <div className="text-xs sm:text-base font-bold text-slate-800 font-mono">
                {formatCurrency(totalBudgetLimit, currency, lang)}
              </div>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">
                {t.spentThisMonth}
              </span>
              <div
                className={`text-xs sm:text-base font-bold font-mono ${
                  totalSpentInBudgetedCats > totalBudgetLimit ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {formatCurrency(totalSpentInBudgetedCats, currency, lang)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of categories (Single column on mobile, 2 columns on tablet/desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
        {categories.map((cat, idx) => {
          const budgetItem = budgets.find((b) => b.categoryId === cat.pkey);
          const limit = budgetItem ? budgetItem.monthlyLimit : 0;
          const spent = expenseByCategory[cat.pkey] || 0;
          const percent = limit > 0 ? (spent / limit) * 100 : 0;
          const isOverBudget = limit > 0 && spent > limit;
          const isWarning = limit > 0 && percent >= 80 && !isOverBudget;
          const remaining = limit - spent;
          const name = getCategoryDisplayName(cat, lang);
          const color = getCategoryColor(idx);

          return (
            <div
              key={cat.pkey}
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all ${
                isOverBudget
                  ? 'border-rose-300 ring-2 ring-rose-50 shadow-2xs'
                  : isWarning
                  ? 'border-amber-300 shadow-2xs'
                  : 'border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${color}15`, color: color }}
                  >
                    <CategoryIcon name={name} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{name}</h4>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {t.spentThisMonth}: <b className="text-slate-700">{formatCurrency(spent, currency, lang)}</b>
                    </span>
                  </div>
                </div>

                {/* Edit limit button or inline input */}
                {editingCatId === cat.pkey ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      step="any"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(cat.pkey)}
                      className="p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(cat.pkey, limit)}
                    className="text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer shrink-0"
                    title={t.setLimit}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="text-[11px] font-bold text-slate-600">
                      {limit > 0 ? formatCurrency(limit, currency, lang) : t.setLimit}
                    </span>
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    {limit > 0 ? `%${Math.round(percent)} ${t.spentPercent}` : t.noLimitSet}
                  </span>
                  <span
                    className={`font-bold font-mono ${
                      isOverBudget
                        ? 'text-rose-600'
                        : remaining < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {limit > 0
                      ? remaining >= 0
                        ? `${t.remaining}: ${formatCurrency(remaining, currency, lang)}`
                        : `${t.exceeded}: +${formatCurrency(Math.abs(remaining), currency, lang)}`
                      : t.noLimitSet}
                  </span>
                </div>

                {limit > 0 && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>
                )}
              </div>

              {isOverBudget && (
                <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{t.limitExceededWarning}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
