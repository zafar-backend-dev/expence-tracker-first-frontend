/**
 * API va tizim asosiy o'zgarmaslari
 */
export const BASE_URL = 'https://expence-tracker-first.onrender.com';
export const API_BASE_URL = BASE_URL;

export const CATEGORIES = {
  EXPENSE: [
    { id: 'food', name: 'Oziq-ovqat va kafe', icon: 'UtensilsCrossed', color: '#f97316', bg: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'transport', name: 'Transport va yoqilg\'i', icon: 'Car', color: '#3b82f6', bg: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'housing', name: 'Uy-joy va kommunal', icon: 'Home', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'shopping', name: 'Xaridlar va kiyim', icon: 'ShoppingBag', color: '#ec4899', bg: 'bg-pink-50 text-pink-600 border-pink-200' },
    { id: 'health', name: 'Salomatlik va dori', icon: 'HeartPulse', color: '#ef4444', bg: 'bg-red-50 text-red-600 border-red-200' },
    { id: 'education', name: 'Ta\'lim va kurslar', icon: 'GraduationCap', color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { id: 'entertainment', name: 'Ko\'ngilochar va hordiq', icon: 'Gamepad2', color: '#eab308', bg: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'bills', name: 'Aloqa va internet', icon: 'Wifi', color: '#10b981', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'gifts', name: 'Sovg\'alar va ehson', icon: 'Gift', color: '#d946ef', bg: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
    { id: 'other_expense', name: 'Boshqa harajatlar', icon: 'MoreHorizontal', color: '#64748b', bg: 'bg-slate-50 text-slate-600 border-slate-200' },
  ],
  INCOME: [
    { id: 'salary', name: 'Oylik maosh', icon: 'Briefcase', color: '#10b981', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'freelance', name: 'Freelance va xizmatlar', icon: 'Laptop', color: '#3b82f6', bg: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'business', name: 'Biznes va savdo', icon: 'TrendingUp', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'investments', name: 'Investitsiya va foizlar', icon: 'Coins', color: '#f59e0b', bg: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'gift_income', name: 'Sovg\'a va mukofot', icon: 'Gift', color: '#ec4899', bg: 'bg-pink-50 text-pink-600 border-pink-200' },
    { id: 'other_income', name: 'Boshqa daromad', icon: 'Wallet', color: '#64748b', bg: 'bg-slate-50 text-slate-600 border-slate-200' },
  ]
};

export const PAYMENT_METHODS = [
  { id: 'card', name: 'Plastik karta (Uzcard/Humo)', icon: 'CreditCard' },
  { id: 'cash', name: 'Naqd pul', icon: 'Banknote' },
  { id: 'bank_transfer', name: 'Bank o\'tkazmasi / Hisob', icon: 'Building2' },
];
