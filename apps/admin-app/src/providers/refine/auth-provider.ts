import type { AuthProvider } from '@refinedev/core';

export const authProvider: AuthProvider = {
  check: async () => {
    const response = await fetch('/api/proxy/staff-auth/session');
    if (response.ok) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      redirectTo: '/auth/sign-in',
    };
  },

  getIdentity: async () => {
    const response = await fetch('/api/proxy/staff-auth/session');
    if (!response.ok) return null;

    const json = await response.json();
    const profile = json.data;
    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.displayName ?? profile.phone,
      phone: profile.phone,
      role: profile.role,
      permissionOverrides: profile.permissionOverrides ?? null,
    };
  },

  logout: async () => {
    await fetch('/api/proxy/staff-auth/logout', { method: 'POST' });
    return { success: true, redirectTo: '/auth/sign-in' };
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: '/auth/sign-in' };
    }
    return { error };
  },

  login: async () => {
    throw new Error('Login is handled by server actions, not authProvider');
  },
};
