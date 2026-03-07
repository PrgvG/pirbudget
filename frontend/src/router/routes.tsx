import { createRoute, redirect } from '@tanstack/react-router';
import { shouldRedirectToLogin } from './authRedirect';
import { rootRoute } from './root';
import { ProtectedDashboard } from './ProtectedDashboard';
import { ProtectedGroups } from './ProtectedGroups';
import { ProtectedIncomes } from './ProtectedIncomes';
import { ProtectedExpenses } from './ProtectedExpenses';
import { ProtectedHistory } from './ProtectedHistory';
import { ProtectedPlan } from './ProtectedPlan';
import { ProtectedStatistics } from './ProtectedStatistics';
import { LoginPage } from '../modules/registration/LoginPage';
import { RegisterPage } from '../modules/registration/RegisterPage';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedDashboard,
});

export const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/groups',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedGroups,
});

export const incomesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/incomes',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedIncomes,
});

export const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedExpenses,
});

export const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedHistory,
});

export const planRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedPlan,
});

export const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats',
  beforeLoad: () => {
    if (shouldRedirectToLogin()) {
      throw redirect({ to: '/login' });
    }
  },
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
