/**
 * Домен: записи (доходы и разовые расходы).
 */

export type { FetchEntriesParams } from './api';
export {
  fetchEntries,
  fetchEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  isEntry,
  isEntryArray,
} from './api';
