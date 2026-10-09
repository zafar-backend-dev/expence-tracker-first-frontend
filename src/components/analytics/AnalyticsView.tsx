import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  Lightbulb
} from 'lucide-react';
import { ApiCategory, ApiTransaction, Language } from '../../types';
import { formatCurrency, getCategoryDisplayName, getCategoryColor } from '../../utils/format';
import { CategoryIcon } from '../common/CategoryIcon';
import { translations } from '../../i18n/translations';

interface AnalyticsViewProps {
  transactions: ApiTransaction[];
  categories: ApiCategory[];
  currency: string;
  lang: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  currency,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes' | 'comparison'>('expenses');

  const categoriesMap = useMemo(() => {
    const map = new Map<string, ApiCategory>();
    categories.forEach((c) => map.set(c.pkey, c));
    return map;
  }, [categories]);

  // Expense statistics by category
  const expenseStats = useMemo(() => {
    const expenses = transactions.filter((tx) => tx.type === 'EXPENSE');
    const totalExp = expenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach((tx) => {
      const catId = tx.categoryId || 'unknown';
      if (!map[catId]) map[catId] = { total: 0, count: 0 };
      map[catId].total += Number(tx.amount || 0);
      map[catId].count += 1;
    });

    const list = Object.entries(map)
      .map(([catId, data], idx) => {
        const cat = categoriesMap.get(catId);
        const name = getCategoryDisplayName(cat, lang);
        const percentage = totalExp > 0 ? (data.total / totalExp) * 100 : 0;
        const color = getCategoryColor(idx);
        return {
          id: catId,
          name,
          color,
          total: data.total,
          count: data.count,
          percentage,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { total: totalExp, list };
  }, [transactions, categoriesMap, lang]);

  // Income statistics by category
  const incomeStats = useMemo(() => {
    const incomes = transactions.filter((tx) => tx.type === 'INCOME');
    const totalInc = incomes.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const map: Record<string, { total: number; count: number }> = {};
    incomes.forEach((tx) => {
      const catId = tx.categoryId || 'unknown';
      if (!map[catId]) map[catId] = { total: 0, count: 0 };
      map[catId].total += Number(tx.amount || 0);
      map[catId].count += 1;
    });

    const list = Object.entries(map)
      .map(([catId, data], idx) => {
        const cat = categoriesMap.get(catId);
        const name = getCategoryDisplayName(cat, lang);
        const percentage = totalInc > 0 ? (data.total / totalInc) * 100 : 0;
        const color = getCategoryColor(idx + 5);
        return {
          id: catId,
          name,
          color,
          total: data.total,
          count: data.count,
          percentage,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { total: totalInc, list };
  }, [transactions, categoriesMap, lang]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const monthsMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx) => {
      const monthKey = tx.transactionDate ? tx.transactionDate.substring(0, 7) : 'Other';
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { income: 0, expense: 0 };
      }
      if (tx.type === 'INCOME') {
        monthsMap[monthKey].income += Number(tx.amount || 0);
      } else {
        monthsMap[monthKey].expense += Number(tx.amount || 0);
      }
    });

    return Object.entries(monthsMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
  }, [transactions]);

  // Donut chart renderer
  const renderDonutChart = (items: typeof expenseStats.list) => {
    if (!items.length) {
      return (
        <div className="flex items-center justify-center h-40 text-xs text-slate-400">
          {t.noDataYet}
        </div>
      );
    }

    let cumulativeAngle = 0;
    const slices = items.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      return { ...item, startAngle, angle };
    });

    return (
      <div className="relative flex items-center justify-center py-2 sm:py-4">
        <svg className="w-40 h-40 sm:w-48 sm:h-48 -rotate-90" viewBox="0 0 100 100">
          {slices.map((slice, idx) => {
            const strokeDasharray = `${(slice.percentage * 282.7) / 100} 282.7`;
            const strokeDashoffset = -((slice.startAngle * 282.7) / 360);
            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {lang === 'tr' ? 'Toplam' : 'Total'}
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
            {formatCurrency(
              activeTab === 'expenses' ? expenseStats.total : incomeStats.total,
              currency,
              lang
            )}
          </span>
        </div>
      </div>
    );
  };

  const topExpenseCategory = expenseStats.list[0];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Analytics Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.analyticsTitle}</span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold tracking-tight">
              {t.analyticsSubtitle}
            </h3>
          </div>

          {topExpenseCategory && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-xs shrink-0 max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{t.topSpendingCategory}</span>
              </div>
              <p className="mt-0.5 text-slate-200 text-[11px] leading-snug">
                %{Math.round(topExpenseCategory.percentage)} {t.topSpendingDesc}{' '}
                <b className="text-white">{topExpenseCategory.name}</b>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Tabs (Horizontally scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'expenses'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{t.expenseStructure}</span>
        </button>
        <button
          onClick={() => setActiveTab('incomes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'incomes'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t.incomeSources}</span>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'comparison'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.monthlyDynamic}</span>
        </button>
      </div>

      {/* 1. Expense structure */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.expenseShare}
            </h4>
            {renderDonutChart(expenseStats.list)}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.totalSpentInCategory}
              </h4>
              <span className="text-xs font-bold text-rose-600 font-mono">
                {formatCurrency(expenseStats.total, currency, lang)}
              </span>
            </div>

            {expenseStats.list.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t.noDataYet}</p>
            ) : (
              <div className="space-y-2.5">
                {expenseStats.list.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          <CategoryIcon name={item.name} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800 truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">({item.count})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-slate-900 text-[11px] sm:text-xs">
                          {formatCurrency(item.total, currency, lang)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 w-8 text-right">
                          %{Math.round(item.percentage)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Income sources */}
      {activeTab === 'incomes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.incomeShare}
            </h4>
            {renderDonutChart(incomeStats.list)}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.incomeSources}
              </h4>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                {formatCurrency(incomeStats.total, currency, lang)}
              </span>
            </div>

            {incomeStats.list.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t.noDataYet}</p>
            ) : (
              <div className="space-y-2.5">
                {incomeStats.list.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          <CategoryIcon name={item.name} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800 truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">({item.count})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-slate-900 text-[11px] sm:text-xs">
                          {formatCurrency(item.total, currency, lang)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 w-8 text-right">
                          %{Math.round(item.percentage)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Monthly Dynamics */}
      {activeTab === 'comparison' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            {t.monthlyTrendTitle}
          </h4>
          {monthlyTrend.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{t.noDataYet}</p>
          ) : (
            <div className="space-y-3 pt-1">
              {monthlyTrend.map(([monthKey, val]) => {
                const maxVal = Math.max(val.income, val.expense, 1);
                return (
                  <div key={monthKey} className="space-y-1 border-b border-slate-50 pb-2.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>{monthKey}</span>
                      <div className="flex items-center gap-2.5 font-mono text-[11px]">
                        <span className="text-emerald-600">
                          +{formatCurrency(val.income, currency, lang)}
                        </span>
                        <span className="text-rose-600">
                          -{formatCurrency(val.expense, currency, lang)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-12 text-slate-400 font-medium">
                          {t.income}:
                        </span>
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(val.income / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-12 text-slate-400 font-medium">
                          {t.expense}:
                        </span>
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(val.expense / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
