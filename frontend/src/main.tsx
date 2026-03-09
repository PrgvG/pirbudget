import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { AuthProvider } from './contexts/AuthProvider';
import { router } from './router';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './index.css';

dayjs.locale('ru');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      defaultColorScheme="light"
      theme={{
        primaryColor: 'blue',
        primaryShade: { light: 6, dark: 4 },
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        defaultRadius: 'md',
        radius: {
          xs: '2px',
          sm: '4px',
          md: '8px',
          lg: '12px',
          xl: '16px',
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '0.75rem',
          lg: '1rem',
          xl: '1.5rem',
        },
        breakpoints: {
          xs: '0em',
          sm: '30em', // 480px
          md: '48em', // 768px
          lg: '64em', // 1024px
          xl: '80em', // 1280px
        },
      }}
    >
      <DatesProvider settings={{ locale: 'ru' }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>
);
