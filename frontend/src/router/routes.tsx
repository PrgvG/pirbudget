import { createRoute, redirect } from '@tanstack/react-router';
import { shouldRedirectToLogin } from './authRedirect';
import { rootRoute } from './root';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { ProtectedDashboard } from './ProtectedDashboard';
import { ProtectedGroups } from './ProtectedGroups';
import { ProtectedIncomes } from './ProtectedIncomes';
import { ProtectedExpenses } from './ProtectedExpenses';
import { ProtectedHistory } from './ProtectedHistory';
import { ProtectedPlan } from './ProtectedPlan';
import { ProtectedStatistics } from './ProtectedStatistics';
import { LoginPage } from '../modules/registration/LoginPage';
import { RegisterPage } from '../modules/registration/RegisterPage';

export const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '.',
  component: ProtectedDashboard,
});

export const groupsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/groups',
  component: ProtectedGroups,
});

export const incomesRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/incomes',
  component: ProtectedIncomes,
});

export const expensesRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/expenses',
  component: ProtectedExpenses,
});

export const historyRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/history',
  component: ProtectedHistory,
});

export const planRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/plan',
  component: ProtectedPlan,
});

export const statisticsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/stats',
  component: ProtectedStatistics,
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
