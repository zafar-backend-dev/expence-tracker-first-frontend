import { BASE_URL } from '../consts';
import { ApiResponse, TokenData, UserInfo, ApiTransaction, ApiCategory, Language } from '../types';

// Yagona manbadan BASE_URL ni eksport qilish
export { BASE_URL } from '../consts';

/**
 * Serverdan kelgan xatolik va xabarlarni tanlangan tilga (en / tr) moslab ajratib olish
 */
export function extractErrorMessage(
  errResponse: any,
  lang: Language = 'en',
  fallbackMessage?: string
): string {
  const defaultFallback =
    fallbackMessage || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred');

  if (!errResponse) return defaultFallback;

  // 1. Agar messageEn yoki messageTr mavjud bo'lsa
  if (lang === 'en' && errResponse.messageEn) {
    return errResponse.messageEn;
  }
  if (lang === 'tr' && errResponse.messageTr) {
    return errResponse.messageTr;
  }
  if (errResponse.messageEn && !errResponse.messageTr) {
    return errResponse.messageEn;
  }
  if (errResponse.messageTr && !errResponse.messageEn) {
    return errResponse.messageTr;
  }

  // 2. Agar message ob'ekt bo'lsa
  if (typeof errResponse.message === 'object' && errResponse.message !== null) {
    if (lang === 'tr' && errResponse.message.tr) return errResponse.message.tr;
    if (lang === 'en' && errResponse.message.en) return errResponse.message.en;
    const anyVal = Object.values(errResponse.message)[0];
    if (typeof anyVal === 'string') return anyVal;
  }

  // 3. Agar message oddiy satr bo'lsa
  if (typeof errResponse.message === 'string' && errResponse.message.trim()) {
    return errResponse.message;
  }

  // 4. ErrorCode bo'yicha tarjima
  if (errResponse.errorCode && errResponse.errorCode !== 'NONE') {
    return translateErrorCode(errResponse.errorCode, lang);
  }

  // 5. Standart JS Error xabarlari
  if (typeof errResponse.error === 'string' && errResponse.error.trim()) {
    return errResponse.error;
  }

  return defaultFallback;
}

function translateErrorCode(code: string, lang: Language): string {
  if (lang === 'tr') {
    switch (code) {
      case 'BAD_CREDENTIALS':
        return 'Kullanıcı adı veya şifre hatalı!';
      case 'NOT_FOUND_EMAIL':
        return 'Böyle bir e-posta adresi mevcut değil!';
      case 'INVALID_CODE':
        return 'Doğrulama kodu hatalı!';
      case 'EXPIRED_CODE':
        return 'Doğrulama kodunun süresi doldu (2 dakika)!';
      case 'USER_ALREADY_EXISTS':
        return 'Bu kullanıcı adı veya e-posta zaten kayıtlı!';
      default:
        return `Hata: ${code}`;
    }
  }

  switch (code) {
    case 'BAD_CREDENTIALS':
      return 'Invalid username or password!';
    case 'NOT_FOUND_EMAIL':
      return 'No such email address found!';
    case 'INVALID_CODE':
      return 'Verification code is invalid!';
    case 'EXPIRED_CODE':
      return 'Verification code has expired (2 minutes)!';
    case 'USER_ALREADY_EXISTS':
      return 'This username or email is already registered!';
    default:
      return `Error: ${code}`;
  }
}

/**
 * Universal request yuboruvchi funksiya
 * 1. bypass-tunnel-reminder va ngrok-skip-browser-warning header'lari qo'shilgan
 * 2. res.ok tekshiriladi, agar false bo'lsa (400, 401, 404, 500) xatolik throw qilinadi
 * 3. BASE_URL to'g'ridan-to'g'ri chaqiriladi
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${BASE_URL}${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        success: res.ok,
        message: text,
        messageEn: text,
        messageTr: text,
        errorCode: res.ok ? 'NONE' : 'SERVER_ERROR',
        data: null,
      };
    }
  }

  // HTTP status kodini tekshirish: agar 4xx yoki 5xx bo'lsa, xatolik otiladi
  if (!res.ok) {
    const errorMsg =
      (typeof data?.message === 'string' ? data.message : null) ||
      data?.messageEn ||
      data?.messageTr ||
      (typeof data?.message === 'object' && data.message
        ? data.message.tr || data.message.en || Object.values(data.message)[0]
        : null) ||
      `HTTP Error ${res.status}: ${res.statusText}`;

    const error: any = new Error(String(errorMsg));
    error.status = res.status;
    error.statusText = res.statusText;
    if (data && typeof data === 'object') {
      Object.assign(error, data);
    } else {
      error.errorCode = `HTTP_${res.status}`;
    }
    throw error;
  }

  return data;
}

export const authApi = {
  signUp: async (payload: {
    fullName: string;
    birthdate: string;
    role?: string;
    password: string;
    confirmPassword: string;
    username: string;
    email: string;
  }): Promise<ApiResponse<null>> => {
    return request<null>('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({
        role: 'USER',
        ...payload,
      }),
    });
  },

  signUpVerify: async (payload: { email: string; code: string }): Promise<ApiResponse<null>> => {
    return request<null>('/api/auth/sign-up/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  signIn: async (payload: { login: string; password: string }): Promise<ApiResponse<null>> => {
    return request<null>('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  signInVerify: async (payload: {
    login: string;
    code: string;
  }): Promise<ApiResponse<TokenData>> => {
    return request<TokenData>('/api/auth/sign-in/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getUserInfo: async (token: string): Promise<ApiResponse<UserInfo>> => {
    return request<UserInfo>('/api/auth/user-info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  forgotPassword: async (payload: { email: string }): Promise<ApiResponse<any>> => {
    return request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resetPassword: async (payload: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<any>> => {
    return request<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Tranzaksiyalar uchun backend API integratsiyasi
 */
export const transactionApi = {
  // get /api/transaction/list (Bearer token)
  list: async (token: string): Promise<ApiResponse<ApiTransaction[]>> => {
    return request<ApiTransaction[]>('/api/transaction/list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // get /api/transaction/{transaction_id} (Bearer token)
  getById: async (token: string, id: string): Promise<ApiResponse<ApiTransaction>> => {
    return request<ApiTransaction>(`/api/transaction/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // post /api/transaction/add (Bearer token)
  add: async (
    token: string,
    payload: {
      amount: number;
      description: string;
      type: 'INCOME' | 'EXPENSE';
      transactionDate: string;
      categoryId: string;
    }
  ): Promise<ApiResponse<ApiTransaction>> => {
    return request<ApiTransaction>('/api/transaction/add', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  // put /api/transaction/{transaction_id}/edit (Bearer token)
  edit: async (
    token: string,
    id: string,
    payload: {
      amount: number;
      description: string;
      type: 'INCOME' | 'EXPENSE';
      transactionDate: string;
      categoryId: string;
    }
  ): Promise<ApiResponse<ApiTransaction>> => {
    return request<ApiTransaction>(`/api/transaction/${id}/edit`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  // delete /api/transaction/{transaction_id}/delete (Bearer token)
  delete: async (token: string, id: string): Promise<ApiResponse<any>> => {
    return request<any>(`/api/transaction/${id}/delete`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

/**
 * Kategoriyalar uchun backend API integratsiyasi
 */
export const categoryApi = {
  // get /api/category/list (Bearer token)
  list: async (token: string): Promise<ApiResponse<ApiCategory[]>> => {
    return request<ApiCategory[]>('/api/category/list', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // get /api/category/search?keyword=word (Bearer token)
  search: async (token: string, keyword: string): Promise<ApiResponse<ApiCategory[]>> => {
    return request<ApiCategory[]>(`/api/category/search?keyword=${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
