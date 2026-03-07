import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './root';
import {
  authenticatedLayoutRoute,
  indexRoute,
  categoriesRoute,
  transactionsRoute,
  monthRoute,
  loginRoute,
  registerRoute,
} from './routes';

const routeTree = rootRoute.addChildren([
  authenticatedLayoutRoute.addChildren([
    indexRoute,
    categoriesRoute,
    transactionsRoute,
    monthRoute,
  ]),
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
