/**
 * Валидация тела запросов для записей (доходы и разовые расходы).
 */

import { z } from 'zod';
import { entryCreateSchema, entryUpdateSchema } from 'shared/entries';

export type EntryCreateValid = {
  ok: true;
  data: z.infer<typeof entryCreateSchema>;
};

export type EntryCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type EntryUpdateValid = {
  ok: true;
  data: z.infer<typeof entryUpdateSchema>;
};

export type EntryUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export function validateEntryCreate(body: unknown): EntryCreateValid | EntryCreateInvalid {
  const result = entryCreateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'amount'
      ? 'AMOUNT_INVALID'
      : path === 'date'
        ? 'DATE_INVALID'
        : path === 'source' || path === 'groupId'
          ? 'REQUIRED_FIELD'
          : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validateEntryUpdate(body: unknown): EntryUpdateValid | EntryUpdateInvalid {
  const result = entryUpdateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code: 'INVALID_BODY',
  };
}
