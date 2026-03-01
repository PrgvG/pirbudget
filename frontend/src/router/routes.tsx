import { createRoute, redirect } from '@tanstack/react-router';
import { shouldRedirectToLogin } from './authRedirect';
import { rootRoute } from './root';
import { ProtectedDashboard } from './ProtectedDashboard';
import { ProtectedGroups } from './ProtectedGroups';
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
