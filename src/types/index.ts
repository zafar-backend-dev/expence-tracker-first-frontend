export interface UserAuthority {
  authority: string;
}

export interface UserInfo {
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  authorities?: UserAuthority[];
  birthdate?: string;
  createdAt?: string;
  credentialsNonExpired?: boolean;
  email: string;
  enabled?: boolean;
  fullName: string;
  pkey: string;
  role: string;
  updatedAt?: string;
  username: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: Record<string, string> | string;
  messageEn?: string;
  messageTr?: string;
  errorCode?: string;
  data: T;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface ApiTransaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  transactionDate: string;
  userid?: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCategory {
  pkey: string;
  nameEn: string;
  nameTr: string;
  descriptionEn?: string;
  descriptionTr?: string;
  orderIndex?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryBudget {
  categoryId: string;
  monthlyLimit: number;
}

export type Language = 'en' | 'tr';
