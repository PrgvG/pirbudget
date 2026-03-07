import { createRoute, redirect } from '@tanstack/react-router';
import { shouldRedirectToLogin } from './authRedirect';
import { rootRoute } from './root';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { ProtectedDashboard } from './ProtectedDashboard';
import { ProtectedCategories } from './ProtectedGroups';
import { ProtectedTransactions } from './ProtectedTransactions';
import { ProtectedMonth } from './ProtectedMonth';
import { LoginPage } from '../modules/registration/LoginPage';
import { RegisterPage } from '../modules/registration/RegisterPage';

export const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/',
  component: ProtectedDashboard,
});

export const categoriesRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/categories',
  component: ProtectedCategories,
});

export const transactionsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/transactions',
  component: ProtectedTransactions,
});

export const monthRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/month',
  component: ProtectedMonth,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});
