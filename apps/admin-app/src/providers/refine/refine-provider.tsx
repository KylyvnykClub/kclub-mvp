'use client';

import type { ReactNode } from 'react';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { dataProvider } from './data-provider';
import { authProvider } from './auth-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const resources = [
  { name: 'categories', list: '/dashboard/settings', meta: { label: 'Categories' } },
  { name: 'countries', list: '/dashboard/settings', meta: { label: 'Countries' } },
  { name: 'cities', list: '/dashboard/settings', meta: { label: 'Cities' } },
  { name: 'businesses', list: '/dashboard/businesses', show: '/dashboard/businesses/:id', meta: { label: 'Businesses' } },
  { name: 'cards', list: '/dashboard/cards', meta: { label: 'Cards' } },
  { name: 'introductions', list: '/dashboard/introductions', meta: { label: 'Introductions' } },
  { name: 'users', list: '/dashboard/users', show: '/dashboard/users/:id', meta: { label: 'Users' } },
  { name: 'staff', list: '/dashboard/staff', meta: { label: 'Staff' } },
  { name: 'audit', list: '/dashboard/settings', meta: { label: 'Audit' } },
  { name: 'subscriptions', list: '/dashboard/billing', meta: { label: 'Subscriptions' } },
  { name: 'memberships', list: '/dashboard/billing', meta: { label: 'Memberships' } },
  { name: 'stripe-prices', list: '/dashboard/billing', meta: { label: 'Stripe Prices' } },
];

type RefineProviderProps = {
  children: ReactNode;
};

export function RefineProvider({ children }: RefineProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerProvider}
        resources={resources}
        options={{ disableTelemetry: true, reactQuery: { clientConfig: queryClient } }}
      >
        {children}
      </Refine>
    </QueryClientProvider>
  );
}
