export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // kuruş cinsinden tam sayı
  categoryId: string;
  note?: string;
  date: string; // ISO formatı
}

export interface Budget {
  categoryId: string;
  limit: number; // aylık limit, kuruş
}