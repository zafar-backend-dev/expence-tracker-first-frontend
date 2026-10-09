import React from 'react';
import {
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { ApiTransaction, Language } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/format';
import { translations } from '../../i18n/translations';

interface OverviewCardsProps {
  transactions: ApiTransaction[];
  currency: string;
  lang: Language;
  onOpenAddModal: (type?: 'INCOME' | 'EXPENSE') => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  transactions,
  currency,
  lang,
  onOpenAddModal,
}) => {
  const t = translations[lang];

  // Totals calculation
  const totalIncome = transactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  // Current month calculation
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTransactions = transactions.filter(
    (tx) => tx.transactionDate && tx.transactionDate.startsWith(currentMonthStr)
  );

  const thisMonthIncome = thisMonthTransactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const thisMonthExpense = thisMonthTransactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Today's expense
  const todayStr = getTodayDateString();
  const todayExpense = transactions
    .filter((tx) => tx.type === 'EXPENSE' && tx.transactionDate?.startsWith(todayStr))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. HERO NET BALANCE CARD (Mobile optimized) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-indigo-300" />
              {t.netBalance}
            </span>
            <span className="bg-white/10 text-white/90 text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/10 font-bold">
              ₺ TRY
            </span>
          </div>

          <div className="mt-2.5 sm:mt-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight font-mono">
              {formatCurrency(balance, currency, lang)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {balance >= 0 ? '● ' + t.financiallyPositive : '● ' + t.expensesExceedIncome}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons on Hero Card for Mobile Thumb Access */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => onOpenAddModal('INCOME')}
                className="flex-1 py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+{t.income}</span>
              </button>
              <button
                onClick={() => onOpenAddModal('EXPENSE')}
                className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>-{t.expense}</span>
              </button>
            </div>

            <div className="hidden sm:flex text-right text-[11px] text-indigo-200">
              <span>{t.thisMonthNet}: <b className="text-white">{formatCurrency(thisMonthIncome - thisMonthExpense, currency, lang)}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB METRICS GRID: 2 COLUMNS ON MOBILE, 3 COLUMNS ON DESKTOP */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Income Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-700">
              <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="truncate">{t.totalIncome}</span>
            </span>
          </div>

          <div className="mt-2">
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(totalIncome, currency, lang)}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              {t.thisMonth}: <b className="text-emerald-600">{formatCurrency(thisMonthIncome, currency, lang)}</b>
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-rose-200 transition">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold">
            <span className="flex items-center gap-1 text-rose-700">
              <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="truncate">{t.totalExpense}</span>
            </span>
          </div>

          <div className="mt-2">
            <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrency(totalExpense, currency, lang)}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              {t.todayExpense}: <b className="text-rose-600">{formatCurrency(todayExpense, currency, lang)}</b>
            </p>
          </div>
        </div>

        {/* Savings Rate Card (spans 2 cols on mobile, 1 col on desktop) */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1 text-indigo-700">
              <PiggyBank className="w-4 h-4 text-indigo-600" />
              <span>{t.savingsRate}</span>
            </span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              %{savingsRate}
            </span>
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  savingsRate > 40
                    ? 'bg-emerald-500'
                    : savingsRate > 15
                    ? 'bg-indigo-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
              <span>%{savingsRate} {t.savedFromIncome}</span>
              <span className="font-semibold text-slate-500">{t.recommendedRate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
