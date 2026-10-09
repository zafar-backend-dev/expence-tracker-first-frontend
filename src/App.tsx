/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useLocation
} from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Receipt,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  LayoutDashboard,
  PieChart,
  ShieldAlert
} from 'lucide-react';
import { UserInfo, ApiTransaction, ApiCategory, CategoryBudget, Language, TransactionType } from './types';
import { authApi, transactionApi, categoryApi, extractErrorMessage } from './services/api';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { OverviewCards } from './components/dashboard/OverviewCards';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { BudgetView } from './components/budgets/BudgetView';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { AuthView } from './components/auth/AuthView';
import { translations } from './i18n/translations';
import { formatCurrency, getCategoryDisplayName } from './utils/format';

// Default initial categories matching backend seed
const DEFAULT_CATEGORIES: ApiCategory[] = [
  {
    pkey: '9b5e0578-6ac7-44ff-8d1f-d3803ed535c4',
    nameEn: 'Food',
    nameTr: 'Yemek',
    descriptionEn: 'Expenses related to food, restaurants and groceries',
    descriptionTr: 'Yemek, restoran ve market alışverişleriyle ilgili harcamalar',
    orderIndex: 1,
    active: true,
  },
  {
    pkey: '7932f786-503b-406c-be01-113c83146bd5',
    nameEn: 'Investment',
    nameTr: 'Yatırım',
    descriptionEn: 'Money received from investments and financial activities',
    descriptionTr: 'Yatırımlar ve finansal faaliyetlerden elde edilen para',
    orderIndex: 2,
    active: true,
  },
  {
    pkey: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    nameEn: 'Transportation',
    nameTr: 'Ulaşım',
    descriptionEn: 'Public transport, fuel, taxi, vehicle maintenance',
    descriptionTr: 'Toplu taşıma, akaryakıt, taksi ve araç bakımı',
    orderIndex: 3,
    active: true,
  },
  {
    pkey: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    nameEn: 'Salary',
    nameTr: 'Maaş',
    descriptionEn: 'Monthly regular employment salary and bonuses',
    descriptionTr: 'Aylık düzenli iş maaşı ve primler',
    orderIndex: 4,
    active: true,
  },
  {
    pkey: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
    nameEn: 'Housing & Utilities',
    nameTr: 'Ev & Faturalar',
    descriptionEn: 'Rent, electricity, water, internet, gas bills',
    descriptionTr: 'Kira, elektrik, su, internet ve doğalgaz faturaları',
    orderIndex: 5,
    active: true,
  },
  {
    pkey: '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
    nameEn: 'Shopping',
    nameTr: 'Alışveriş',
    descriptionEn: 'Clothes, electronics, personal shopping',
    descriptionTr: 'Giyim, elektronik ve kişisel alışverişler',
    orderIndex: 6,
    active: true,
  },
];

export default function App() {
  return (
    <HashRouter>
      <MainAppContent />
    </HashRouter>
  );
}

function MainAppContent() {
  const [lang, setLangState] = useState<Language>(() => storageService.getLanguage());
  const currency = 'TRY';

  const setLang = (l: Language) => {
    setLangState(l);
    storageService.setLanguage(l);
  };

  const t = translations[lang];

  // User state restored immediately from cache to prevent flicker/logout on refresh
  const [user, setUser] = useState<UserInfo | null>(() => storageService.getCachedUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('moliya_access_token'));
  const [loadingAuth, setLoadingAuth] = useState<boolean>(() => !storageService.getCachedUser() && !!localStorage.getItem('moliya_access_token'));

  // Backend data restored immediately from cache so data is never lost on refresh
  const [transactions, setTransactions] = useState<ApiTransaction[]>(() => storageService.getCachedTransactions());
  const [categories, setCategories] = useState<ApiCategory[]>(() => {
    const cached = storageService.getCachedCategories();
    return cached && cached.length > 0 ? cached : DEFAULT_CATEGORIES;
  });
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    const cachedUser = storageService.getCachedUser();
    return cachedUser ? storageService.getBudgets(cachedUser.pkey || cachedUser.username) : [];
  });
  const [refreshingData, setRefreshingData] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('EXPENSE');
  const [editingTransaction, setEditingTransaction] = useState<ApiTransaction | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch categories from backend and update cache
  const fetchCategories = useCallback(async (authToken: string) => {
    try {
      const res = await categoryApi.list(authToken);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
        storageService.setCachedCategories(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch categories, keeping cached', e);
    }
  }, []);

  // Fetch transactions from backend and update cache
  const fetchTransactions = useCallback(async (authToken: string) => {
    setRefreshingData(true);
    try {
      const res = await transactionApi.list(authToken);
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
        storageService.setCachedTransactions(res.data);
      }
    } catch (e) {
      console.error('Failed to load transactions, keeping cached', e);
    } finally {
      setRefreshingData(false);
    }
  }, []);

  // Revalidate session and data in background on boot
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('moliya_access_token');
      if (!savedToken) {
        setLoadingAuth(false);
        return;
      }

      try {
        const res = await authApi.getUserInfo(savedToken);
        if (res.success && res.data) {
          setUser(res.data);
          setToken(savedToken);
          storageService.setCachedUser(res.data);
          await Promise.all([
            fetchCategories(savedToken),
            fetchTransactions(savedToken),
          ]);
          setBudgets(storageService.getBudgets(res.data.pkey || res.data.username));
        } else {
          // Token expired
          localStorage.removeItem('moliya_access_token');
          localStorage.removeItem('moliya_refresh_token');
          storageService.setCachedUser(null);
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.error('Session validation error, using cache', e);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkSession();
  }, [fetchCategories, fetchTransactions]);

  // Auth Success callback
  const handleAuthSuccess = async (userInfo: UserInfo, accessToken: string) => {
    setUser(userInfo);
    setToken(accessToken);
    storageService.setCachedUser(userInfo);
    await Promise.all([
      fetchCategories(accessToken),
      fetchTransactions(accessToken),
    ]);
    const userKey = userInfo.pkey || userInfo.username;
    setBudgets(storageService.getBudgets(userKey));
    showToast(`${t.welcomeUser}, ${userInfo.fullName || userInfo.username}!`);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('moliya_access_token');
    localStorage.removeItem('moliya_refresh_token');
    storageService.setCachedUser(null);
    storageService.setCachedTransactions([]);
    setUser(null);
    setToken(null);
    setTransactions([]);
    setBudgets([]);
    showToast(t.logoutSuccess);
  };

  // Add / Edit Transaction
  const handleSaveTransaction = async (
    payload: {
      amount: number;
      description: string;
      type: TransactionType;
      transactionDate: string;
      categoryId: string;
    },
    idToEdit?: string
  ) => {
    if (!token) return;

    try {
      if (idToEdit) {
        const res = await transactionApi.edit(token, idToEdit, payload);
        if (res.success) {
          showToast(t.txEditSuccess);
          await fetchTransactions(token);
        } else {
          showToast(extractErrorMessage(res, lang, t.serverError));
        }
      } else {
        const res = await transactionApi.add(token, payload);
        if (res.success) {
          showToast(t.txAddSuccess);
          await fetchTransactions(token);
        } else {
          showToast(extractErrorMessage(res, lang, t.serverError));
        }
      }
    } catch (err: any) {
      showToast(extractErrorMessage(err, lang, t.serverError));
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!token) return;
    try {
      const res = await transactionApi.delete(token, id);
      if (res.success) {
        showToast(t.deleteSuccess);
        await fetchTransactions(token);
      } else {
        showToast(extractErrorMessage(res, lang, t.serverError));
      }
    } catch (err: any) {
      showToast(extractErrorMessage(err, lang, t.serverError));
    }
  };

  // Save category budgets
  const handleSaveBudgets = (newBudgets: CategoryBudget[]) => {
    if (!user) return;
    const userKey = user.pkey || user.username;
    storageService.saveBudgets(userKey, newBudgets);
    setBudgets(newBudgets);
    showToast(lang === 'tr' ? 'Bütçe limitleri kaydedildi' : 'Budget limits saved');
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (!token) return;
    for (const tx of transactions) {
      try {
        await transactionApi.delete(token, tx.id);
      } catch {}
    }
    await fetchTransactions(token);
    showToast(t.allDataCleared);
  };

  // Export CSV & JSON
  const categoriesMap = useMemo(() => {
    const map = new Map<string, ApiCategory>();
    categories.forEach((c) => map.set(c.pkey, c));
    return map;
  }, [categories]);

  const handleExportCSV = () => {
    storageService.exportToCSV(transactions, categoriesMap, lang);
    showToast(
      lang === 'tr'
        ? 'Excel (CSV) raporu indirildi'
        : 'Excel (CSV) report downloaded'
    );
  };

  const handleExportJSON = () => {
    if (!user) return;
    storageService.exportToJSON(transactions, user.username);
    showToast(
      lang === 'tr'
        ? 'JSON yedek dosyası indirildi'
        : 'JSON backup file downloaded'
    );
  };

  const handleOpenAddModal = (type?: TransactionType) => {
    setEditingTransaction(null);
    setAddModalType(type || 'EXPENSE');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: ApiTransaction) => {
    setEditingTransaction(tx);
    setAddModalType(tx.type);
    setIsAddModalOpen(true);
  };

  if (loadingAuth && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 animate-pulse">
          <Wallet className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">{t.loading}</p>
      </div>
    );
  }

  // Not signed in -> Show Auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <AuthView onSuccess={handleAuthSuccess} lang={lang} setLang={setLang} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom duration-300 border border-slate-700/80 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={user}
        onOpenAddModal={() => handleOpenAddModal('EXPENSE')}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Router Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3.5 sm:pt-6 pb-24 md:pb-12 flex-1 w-full space-y-4 sm:space-y-6">
        <Routes>
          {/* Default redirect to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 1. DASHBOARD ROUTE */}
          <Route
            path="/dashboard"
            element={
              <div className="space-y-6">
                <OverviewCards
                  transactions={transactions}
                  currency={currency}
                  lang={lang}
                  onOpenAddModal={handleOpenAddModal}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Transactions List (2 cols) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                        <span>{t.transactions}</span>
                      </h3>
                      <NavLink
                        to="/transactions"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>
                          {lang === 'tr' ? 'Tümünü Gör' : 'View All'} ({transactions.length})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </NavLink>
                    </div>

                    <TransactionList
                      transactions={transactions.slice(0, 6)}
                      categories={categories}
                      currency={currency}
                      lang={lang}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteTransaction}
                      onOpenAddModal={handleOpenAddModal}
                      onExportCSV={handleExportCSV}
                      onExportJSON={handleExportJSON}
                    />
                  </div>

                  {/* Sidebar: Budget Summary & Financial Tip */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-600" />
                          <span>{t.budgets}</span>
                        </h3>
                        <NavLink
                          to="/budgets"
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {t.manageBudgets}
                        </NavLink>
                      </div>

                      {budgets.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          <p>{t.noLimitSet}</p>
                          <NavLink
                            to="/budgets"
                            className="mt-2 inline-block text-indigo-600 font-bold hover:underline"
                          >
                            {t.setLimit}
                          </NavLink>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {budgets.slice(0, 4).map((b) => {
                            const now = new Date();
                            const currentMonthStr = `${now.getFullYear()}-${String(
                              now.getMonth() + 1
                            ).padStart(2, '0')}`;
                            const spent = transactions
                              .filter(
                                (tx) =>
                                  tx.type === 'EXPENSE' &&
                                  tx.categoryId === b.categoryId &&
                                  tx.transactionDate?.startsWith(currentMonthStr)
                              )
                              .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
                            const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
                            const isOver = spent > b.monthlyLimit;
                            const cat = categoriesMap.get(b.categoryId);
                            const catName = getCategoryDisplayName(cat, lang);

                            return (
                              <div key={b.categoryId} className="space-y-1 text-xs">
                                <div className="flex justify-between font-medium">
                                  <span className="text-slate-700 font-semibold">{catName}</span>
                                  <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                    %{Math.round(percent)}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isOver
                                        ? 'bg-rose-500'
                                        : percent > 80
                                        ? 'bg-amber-500'
                                        : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 via-blue-50/50 to-indigo-50/20 rounded-2xl p-5 border border-indigo-100/80 shadow-2xs">
                      <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>{lang === 'tr' ? 'Akıllı İpucu' : 'Financial Tip'}</span>
                      </div>
                      <p className="text-xs text-indigo-950/90 leading-relaxed">
                        {lang === 'tr'
                          ? 'Her harcamanızı sisteme kaydetmek, ay sonunda bütçenizi aşmadan tasarruf yapmanıza yardımcı olur.'
                          : 'Logging every expense as it occurs gives you total clarity over your financial health and prevents unplanned spending.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          {/* 2. TRANSACTIONS ROUTE */}
          <Route
            path="/transactions"
            element={
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {t.allTransactions}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.transactionsSubtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal('EXPENSE')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addTransaction}</span>
                  </button>
                </div>

                <TransactionList
                  transactions={transactions}
                  categories={categories}
                  currency={currency}
                  lang={lang}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTransaction}
                  onOpenAddModal={handleOpenAddModal}
                  onExportCSV={handleExportCSV}
                  onExportJSON={handleExportJSON}
                />
              </div>
            }
          />

          {/* 3. ANALYTICS ROUTE */}
          <Route
            path="/analytics"
            element={
              <div className="space-y-4">
                <AnalyticsView
                  transactions={transactions}
                  categories={categories}
                  currency={currency}
                  lang={lang}
                />
              </div>
            }
          />

          {/* 4. BUDGETS ROUTE */}
          <Route
            path="/budgets"
            element={
              <div className="space-y-4">
                <BudgetView
                  budgets={budgets}
                  categories={categories}
                  transactions={transactions}
                  currency={currency}
                  lang={lang}
                  onSaveBudgets={handleSaveBudgets}
                />
              </div>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        editTransaction={editingTransaction}
        initialType={addModalType}
        categories={categories}
        currency={currency}
        lang={lang}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        lang={lang}
        onLogout={handleLogout}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
