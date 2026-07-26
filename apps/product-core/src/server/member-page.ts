import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

import { AppError } from '@/server/errors';
import { getMemberBySupabaseUserId, toCurrentMemberProfileDto } from '@/server/services';
import type { Locale } from '@/i18n/routing';

export async function getCurrentMemberProfileForPage(): Promise<CurrentMemberProfileDto | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown> | undefined;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>),
            );
          } catch {
            // Server components cannot always commit refreshed cookies.
          }
        },
      },
    },
  );

  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser) return null;

  try {
    const user = await getMemberBySupabaseUserId(supabaseUser.id);
    return toCurrentMemberProfileDto(user);
  } catch (error) {
    if (error instanceof AppError) return null;
    throw error;
  }
}

export async function requireCurrentMember(locale: Locale): Promise<CurrentMemberProfileDto> {
  const profile = await getCurrentMemberProfileForPage();
  if (!profile) redirect(`/${locale}/sign-in`);

  return profile;
}

export async function getCurrentPagePathname(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get('x-kclub-pathname') ?? '';
}

export function isOnboardingPath(pathname: string): boolean {
  return /\/m\/onboarding\/?$/.test(pathname);
}

export const ONBOARDING_SKIP_COOKIE = 'kclub_onboarding_skipped';

export async function hasSkippedOnboarding(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ONBOARDING_SKIP_COOKIE)?.value === '1';
}
