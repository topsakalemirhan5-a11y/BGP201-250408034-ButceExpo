import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { Budget, Category, Transaction, TransactionType } from '../types';

export interface Recurring {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  dayOfMonth: number; // 1-28
  lastRun: string; // 'yyyy-MM', en son işlenen ay
}

const defaultCategories: Category[] = [
  { id: 'maas', name: 'Maaş', icon: '💼', color: '#22c55e', type: 'income' },
  { id: 'market', name: 'Market', icon: '🛒', color: '#f97316', type: 'expense' },
  { id: 'fatura', name: 'Fatura', icon: '💡', color: '#eab308', type: 'expense' },
  { id: 'ulasim', name: 'Ulaşım', icon: '🚌', color: '#3b82f6', type: 'expense' },
  { id: 'eglence', name: 'Eğlence', icon: '🎮', color: '#a855f7', type: 'expense' },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurring: Recurring[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  removeCategory: (id: string) => void;
  addRecurring: (r: Omit<Recurring, 'id' | 'lastRun'>) => void;
  removeRecurring: (id: string) => void;
  processRecurring: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: defaultCategories,
      budgets: [],
      recurring: [],

      addTransaction: t =>
        set(s => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })),

      updateTransaction: (id, patch) =>
        set(s => ({
          transactions: s.transactions.map(t => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTransaction: id =>
        set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

      setBudget: (categoryId, limit) =>
        set(s => ({
          budgets: [
            ...s.budgets.filter(b => b.categoryId !== categoryId),
            { categoryId, limit },
          ],
        })),

      addCategory: c =>
        set(s => ({ categories: [...s.categories, { ...c, id: 'c' + uid() }] })),

      removeCategory: id =>
        set(s => ({
          categories: s.categories.filter(c => c.id !== id),
          budgets: s.budgets.filter(b => b.categoryId !== id),
        })),

      addRecurring: r => {
        set(s => ({
          recurring: [
            ...s.recurring,
            { ...r, id: uid(), lastRun: format(subMonths(new Date(), 1), 'yyyy-MM') },
          ],
        }));
        get().processRecurring();
      },

      removeRecurring: id =>
        set(s => ({ recurring: s.recurring.filter(r => r.id !== id) })),

      processRecurring: () =>
        set(s => {
          const now = new Date();
          const nowKey = format(now, 'yyyy-MM');
          const created: Transaction[] = [];

          const updated = s.recurring.map(r => {
            let cursor = addMonths(parse(r.lastRun + '-01', 'yyyy-MM-dd', new Date()), 1);
            let last = r.lastRun;
            let guard = 0;
            while (format(cursor, 'yyyy-MM') <= nowKey && guard < 36) {
              const key = format(cursor, 'yyyy-MM');
              if (key < nowKey || r.dayOfMonth <= now.getDate()) {
                const date = new Date(cursor.getFullYear(), cursor.getMonth(), r.dayOfMonth, 9, 0, 0);
                created.push({
                  id: uid() + created.length,
                  type: r.type,
                  amount: r.amount,
                  categoryId: r.categoryId,
                  note: r.note,
                  date: date.toISOString(),
                });
                last = key;
              } else {
                break;
              }
              cursor = addMonths(cursor, 1);
              guard++;
            }
            return { ...r, lastRun: last };
          });

          if (created.length === 0) return {};
          return {
            transactions: [...created, ...s.transactions],
            recurring: updated,
          };
        }),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);