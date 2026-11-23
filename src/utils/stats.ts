import { isSameMonth } from 'date-fns';
import { Transaction } from '../types';

export function monthlySummary(transactions: Transaction[], month: Date) {
  const inMonth = transactions.filter(t => isSameMonth(new Date(t.date), month));
  const income = inMonth.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = inMonth.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function spentByCategory(transactions: Transaction[], month: Date) {
  const map: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), month))
    .forEach(t => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
  return map;
}