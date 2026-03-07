/**
 * Домен: категории (доходы и расходы).
 */

export * from './types';
export {
  fetchCategories,
  fetchArchivedCategories,
  fetchCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  isCategory,
  isCategoryArray,
} from './api';
