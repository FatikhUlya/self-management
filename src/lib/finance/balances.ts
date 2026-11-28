import type { FinancialAccount, Transaction } from '@/lib/hooks/useLifeOSState';

export const DEFAULT_ACCOUNT = 'Tunai';
const accountOf = (t: Pick<Transaction, 'account'>) => t.account || DEFAULT_ACCOUNT;

export interface AccountBalance {
  name: string;
  account?: FinancialAccount;
  opening: number;
  openingDate?: string;
  /** Opening balance + income − expense dated on/after the opening date. */
  balance: number;
  /** Transactions counted in the balance. */
  counted: number;
  /** Dated before the opening date: already inside the opening balance, not counted again. */
  preOpening: Transaction[];
}

/** The account's opening date, if a transaction falls before it. */
export function preOpeningDate(t: Pick<Transaction, 'account' | 'date'>, accounts: FinancialAccount[]): string | null {
  const acc = accounts.find((a) => a.name === accountOf(t));
  return acc?.openingDate && t.date && t.date < acc.openingDate ? acc.openingDate : null;
}

/**
 * Per-account balances. With an opening balance the account starts from it on
 * its opening date; without one, every transaction counts (as before).
 */
export function computeBalances(accounts: FinancialAccount[], transactions: Transaction[], extraNames: string[] = []) {
  const names = Array.from(new Set([...accounts.map((a) => a.name), ...extraNames, ...transactions.map(accountOf)]));
  const rows: AccountBalance[] = names.map((name) => {
    const account = accounts.find((a) => a.name === name);
    const openingDate = account?.openingDate || undefined;
    const opening = openingDate ? Number(account?.openingBalance || 0) : 0;
    let balance = opening, counted = 0;
    const preOpening: Transaction[] = [];
    for (const t of transactions) {
      if (accountOf(t) !== name) continue;
      if (openingDate && t.date < openingDate) { preOpening.push(t); continue; }
      balance += t.type === 'income' ? Number(t.amount || 0) : t.type === 'expense' ? -Number(t.amount || 0) : 0;
      counted++;
    }
    return { name, account, opening, openingDate, balance, counted, preOpening };
  });
  rows.sort((a, b) => b.balance - a.balance);
  return {
    rows,
    total: rows.reduce((s, r) => s + r.balance, 0),
    preOpening: rows.flatMap((r) => r.preOpening).sort((a, b) => b.date.localeCompare(a.date)),
  };
}
