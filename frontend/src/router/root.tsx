import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from './RootLayout';
import { NotFoundPage } from './NotFoundPage';

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
