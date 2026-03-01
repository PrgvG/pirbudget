/**
 * Группы платежей (категории расходов).
 * Расходы ссылаются на группу через groupId.
 */

import type { EntityId } from "./ids.js";

export type PaymentGroup = {
  id: EntityId;
  name: string;
  sortOrder: number;
  /** При отсутствии — фолбек на дефолтный "серый". */
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentGroupCreate = {
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
};

export type PaymentGroupUpdate = Partial<Omit<PaymentGroupCreate, "name">> & { name?: string };
