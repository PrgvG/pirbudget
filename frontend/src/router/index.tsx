import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './root';
import { indexRoute, loginRoute, registerRoute } from './routes';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
