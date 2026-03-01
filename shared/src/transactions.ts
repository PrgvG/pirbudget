/**
 * Единая сущность «операция»: доход и расход с различателем direction.
 * Общие правила и формы; для расхода — те же типы платежей с direction: "expense".
 */

import type { EntityId } from "./ids.js";
import type { ExpensePayment } from "./expenses.js";

export type IncomeEntry = {
  direction: "income";
  id: EntityId;
  amount: number;
  /** ISO date */
  date: string;
  source: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseEntry = ExpensePayment & { direction: "expense" };

export type Transaction = IncomeEntry | ExpenseEntry;

// DTO
export type IncomeEntryCreate = Omit<IncomeEntry, "id" | "createdAt" | "updatedAt"> & {
  localId?: string;
};
export type IncomeEntryUpdate = Partial<Omit<IncomeEntry, "id" | "createdAt" | "updatedAt">>;
