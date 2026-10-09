import { ApiCategory, ApiTransaction, CategoryBudget, Language } from '../types';
import { getCategoryDisplayName } from '../utils/format';

const STORAGE_PREFIX = 'fintrack_app_';

export const storageService = {
  getLanguage(): Language {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}lang`);
      if (saved === 'tr' || saved === 'en') return saved;
    } catch {}
    return 'en';
  },

  setLanguage(lang: Language): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}lang`, lang);
    } catch {}
  },

  getCurrency(): string {
    return 'TRY';
  },

  setCurrency(_curr: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}currency`, 'TRY');
    } catch {}
  },

  getCachedUser(): any | null {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}user_profile`);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  setCachedUser(user: any | null): void {
    try {
      if (user) {
        localStorage.setItem(`${STORAGE_PREFIX}user_profile`, JSON.stringify(user));
      } else {
        localStorage.removeItem(`${STORAGE_PREFIX}user_profile`);
      }
    } catch {}
  },

  getCachedTransactions(): ApiTransaction[] {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}cached_txs`);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  setCachedTransactions(txs: ApiTransaction[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}cached_txs`, JSON.stringify(txs));
    } catch {}
  },

  getCachedCategories(): ApiCategory[] {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}cached_cats`);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  setCachedCategories(cats: ApiCategory[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}cached_cats`, JSON.stringify(cats));
    } catch {}
  },

  getBudgets(userKey: string): CategoryBudget[] {
    if (!userKey) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}budgets_${userKey}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveBudgets(userKey: string, budgets: CategoryBudget[]): void {
    if (!userKey) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}budgets_${userKey}`, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to save budgets', e);
    }
  },

  exportToCSV(
    transactions: ApiTransaction[],
    categoriesMap: Map<string, ApiCategory>,
    lang: Language
  ): void {
    if (!transactions.length) return;

    const headers =
      lang === 'tr'
        ? ['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Tutar']
        : ['Date', 'Type', 'Category', 'Description', 'Amount'];

    const rows = transactions.map((t) => {
      const cat = categoriesMap.get(t.categoryId);
      const catName = getCategoryDisplayName(cat, lang);
      const typeLabel =
        t.type === 'INCOME' ? (lang === 'tr' ? 'Gelir' : 'Income') : lang === 'tr' ? 'Gider' : 'Expense';

      return [
        t.transactionDate ? t.transactionDate.split('T')[0] : '',
        typeLabel,
        `"${catName.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `fintrack_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToJSON(transactions: ApiTransaction[], userKey: string): void {
    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `fintrack_backup_${userKey}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
