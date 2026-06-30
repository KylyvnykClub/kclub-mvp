import { redirect } from 'next/navigation';

import { readStaffSession } from '@/server/auth/session';

export async function requireStaffSession() {
  const session = await readStaffSession();

  if (!session?.token) {
    redirect('/auth/sign-in');
  }

  return session;
}
