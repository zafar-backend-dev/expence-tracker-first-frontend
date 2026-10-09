import { ApiCategory, Language } from '../types';

export function formatCurrency(amount: number, _currency: string = 'TRY', lang: Language = 'en'): string {
  if (isNaN(amount)) amount = 0;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₺${formatted}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  hasTime: boolean;
  dateString: string;
  timeString: string;
} | null {
  if (!dateStr) return null;
  // Match YYYY-MM-DD and optional THH:mm(:ss)?
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const hasTime = match[4] !== undefined;
    const hours = hasTime ? parseInt(match[4], 10) : 0;
    const minutes = hasTime ? parseInt(match[5], 10) : 0;
    const dateString = `${match[1]}-${match[2]}-${match[3]}`;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return {
      year,
      month,
      day,
      hours,
      minutes,
      hasTime,
      dateString,
      timeString,
    };
  }

  // Fallback to Date object if string is in an alternative format
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hours = d.getHours();
      const minutes = d.getMinutes();
      return {
        year,
        month,
        day,
        hours,
        minutes,
        hasTime: true,
        dateString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      };
    }
  } catch {
    // fallback
  }
  return null;
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function formatDateLocale(dateStr: string, lang: Language = 'en', includeTime: boolean = true): string {
  if (!dateStr) return '';
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;

  const monthName = lang === 'tr' ? TR_MONTHS[parts.month - 1] || '' : EN_MONTHS[parts.month - 1] || '';
  const dateFormatted = lang === 'tr'
    ? `${parts.day} ${monthName} ${parts.year}`
    : `${monthName} ${parts.day}, ${parts.year}`;

  if (!includeTime || !parts.hasTime) return dateFormatted;
  return `${dateFormatted}, ${parts.timeString}`;
}

export function formatDateTimeLocale(
  dateStr: string,
  lang: Language = 'en'
): { date: string; time: string; full: string } {
  if (!dateStr) return { date: '', time: '', full: '' };
  const parts = parseDateParts(dateStr);
  if (!parts) return { date: dateStr, time: '', full: dateStr };

  const monthName = lang === 'tr' ? TR_MONTHS[parts.month - 1] || '' : EN_MONTHS[parts.month - 1] || '';
  const dateFormatted = lang === 'tr'
    ? `${parts.day} ${monthName} ${parts.year}`
    : `${monthName} ${parts.day}, ${parts.year}`;

  const timeFormatted = parts.timeString;

  return {
    date: dateFormatted,
    time: timeFormatted,
    full: `${dateFormatted} • ${timeFormatted}`,
  };
}

export function getCategoryDisplayName(cat?: ApiCategory | null, lang: Language = 'en'): string {
  if (!cat) return lang === 'tr' ? 'Kategori Yok' : 'Uncategorized';
  if (lang === 'tr') {
    return cat.nameTr || cat.nameEn || 'Kategori';
  }
  return cat.nameEn || cat.nameTr || 'Category';
}

export function getCategoryDescription(cat?: ApiCategory | null, lang: Language = 'en'): string {
  if (!cat) return '';
  if (lang === 'tr') {
    return cat.descriptionTr || cat.descriptionEn || '';
  }
  return cat.descriptionEn || cat.descriptionTr || '';
}

// Ranglar va piktogrammalar uchun xaritalash
const categoryColorPalette = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // amber
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d946ef', // fuchsia
  '#64748b', // slate
];

export function getCategoryColor(indexOrId: number | string): string {
  if (typeof indexOrId === 'number') {
    return categoryColorPalette[Math.abs(indexOrId) % categoryColorPalette.length];
  }
  let hash = 0;
  for (let i = 0; i < indexOrId.length; i++) {
    hash = indexOrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return categoryColorPalette[Math.abs(hash) % categoryColorPalette.length];
}
