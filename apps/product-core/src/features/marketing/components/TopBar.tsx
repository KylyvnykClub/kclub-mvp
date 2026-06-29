'use client';

import {
  ArrowUpRight,
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { IconButton, cn } from '@kclub/ui';
import { Locale } from '@/i18n/routing';

import { LocaleSwitcherLinks } from './LocaleSwitcherLinks';
import { ThemeToggle } from './ThemeToggle';

type NavItem = {
  key: 'catalog' | 'about' | 'how_it_works' | 'partners' | 'faq' | 'contact';
  href: string;
};

export function TopBar({
  locale,
  isAuthenticated = false,
}: {
  locale: Locale;
  isAuthenticated?: boolean;
}): ReactElement {
  const t = useTranslations('home');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);
  const navItems: NavItem[] = [
    { key: 'about', href: `/${locale}/#about` },
    { key: 'how_it_works', href: `/${locale}/#how-it-works` },
    { key: 'catalog', href: `/${locale}/directory` },
    { key: 'partners', href: `/${locale}/#partners` },
    { key: 'faq', href: `/${locale}/#faq` },
    { key: 'contact', href: `/${locale}/#contact` },
  ];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (!accountRef.current?.contains(target)) {
        setAccountOpen(false);
      }

      if (!localeRef.current?.contains(target)) {
        setLocaleOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setLocaleOpen(false);
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' });

      if (!response.ok) {
        setSignOutError(t('nav.signOutError'));
        return;
      }

      setAccountOpen(false);
      setOpen(false);
      router.replace(`/${locale}/sign-in`);
      router.refresh();
    } catch {
      setSignOutError(t('nav.signOutError'));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="kclub-premium-header sticky top-0 z-50 h-[72px] border-b shadow-[0_14px_42px_rgba(15,15,16,0.06)] backdrop-blur-xl">
      <div className="kclub-shell flex h-full items-center justify-between">
        <Link
          href={`/${locale}`}
          className="group inline-flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-focus dark:focus-visible:ring-white dark:focus-visible:ring-offset-focus"
        >
          <span className="grid text-2xl font-bold leading-none text-zinc-950 dark:text-white">
            <span>KYLYVNYK CLUB</span>
            <span className="text-thin text-base font-normal text-zinc-500 dark:text-zinc-500">
              discover new
            </span>
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-4 text-sm font-semibold text-zinc-950 dark:text-white md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="kclub-topbar-link group inline-flex h-11 items-center px-1 uppercase tracking-[0.08em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}

          <div ref={localeRef} className="relative flex h-full items-center pl-4">
            <IconButton
              aria-label={t('footer.locales')}
              aria-expanded={localeOpen}
              aria-controls="locale-switcher"
              onClick={() => {
                setLocaleOpen((value) => !value);
                setAccountOpen(false);
              }}
              className="kclub-topbar-control h-10 w-10 focus-visible:ring-accent"
            >
              <Globe aria-hidden="true" size={16} strokeWidth={1.5} />
            </IconButton>

            {localeOpen && (
              <div
                id="locale-switcher"
                className="kclub-topbar-menu absolute right-0 top-full z-50 mt-3 w-40 rounded-md border p-1"
              >
                <LocaleSwitcherLinks
                  locale={locale}
                  variant="topbar-menu"
                  onSelect={() => setLocaleOpen(false)}
                />
              </div>
            )}
          </div>

          <div className="flex h-full items-center pl-1">
            <ThemeToggle className="h-10 w-10" />
          </div>

          <div ref={accountRef} className="relative flex h-full items-center pl-1">
            <button
              type="button"
              aria-label={t('nav.account')}
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              onClick={() => {
                setAccountOpen((value) => !value);
                setLocaleOpen(false);
              }}
              className="kclub-topbar-control inline-flex h-10 items-center gap-2 px-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <UserRound aria-hidden="true" size={17} strokeWidth={1.6} />
              <ChevronDown
                aria-hidden="true"
                size={14}
                strokeWidth={1.6}
                className={cn('transition', accountOpen && 'rotate-180')}
              />
            </button>

            {accountOpen && (
              <div
                id="account-menu"
                className="kclub-topbar-menu absolute right-0 top-full z-50 mt-3 w-52 rounded-md border p-1 shadow-2xl backdrop-blur-xl"
              >
                {isAuthenticated ? (
                  <>
                    <AccountLink
                      href={`/${locale}/m/dashboard`}
                      onClick={() => setAccountOpen(false)}
                    >
                      <LayoutDashboard aria-hidden="true" size={16} strokeWidth={1.6} />
                      {t('nav.dashboard')}
                    </AccountLink>
                    <AccountButton onClick={handleSignOut} disabled={isSigningOut}>
                      <LogOut aria-hidden="true" size={16} strokeWidth={1.6} />
                      {isSigningOut ? t('nav.signingOut') : t('nav.signOut')}
                    </AccountButton>
                  </>
                ) : (
                  <>
                    <AccountLink href={`/${locale}/sign-in`} onClick={() => setAccountOpen(false)}>
                      <LogIn aria-hidden="true" size={16} strokeWidth={1.6} />
                      {t('nav.signIn')}
                    </AccountLink>
                    <AccountLink href={`/${locale}/sign-up`} onClick={() => setAccountOpen(false)}>
                      <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.6} />
                      {t('nav.join')}
                    </AccountLink>
                  </>
                )}
                {signOutError ? (
                  <p role="alert" className="px-3 py-2 text-xs text-red-600 dark:text-red-300">
                    {signOutError}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className="h-10 w-10" />
          <button
            type="button"
            aria-label={open ? t('common.close') : t('common.menu')}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
            className="kclub-topbar-control inline-flex h-11 w-11 items-center justify-center border shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {open ? (
              <X aria-hidden="true" size={20} strokeWidth={1.5} />
            ) : (
              <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="kclub-mobile-nav-panel fixed inset-x-0 top-[72px] z-50 border-b shadow-2xl backdrop-blur-xl md:hidden"
        >
          <nav className="kclub-shell grid gap-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md border border-zinc-200/80 bg-white/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-950 transition hover:bg-zinc-950 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white dark:hover:text-zinc-950 dark:focus-visible:ring-white"
              >
                {t(`nav.${item.key}`)}
                <ArrowUpRight aria-hidden="true" size={16} className="text-accent" />
              </Link>
            ))}
            <p className="dark:text-white/54 mt-2 px-4 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {t('nav.account')}
            </p>
            <div className="grid gap-1">
              {isAuthenticated ? (
                <>
                  <MobileLink href={`/${locale}/m/dashboard`} onClick={() => setOpen(false)}>
                    <LayoutDashboard aria-hidden="true" size={16} strokeWidth={1.6} />
                    {t('nav.dashboard')}
                  </MobileLink>
                  <MobileButton onClick={handleSignOut} disabled={isSigningOut}>
                    <LogOut aria-hidden="true" size={16} strokeWidth={1.6} />
                    {isSigningOut ? t('nav.signingOut') : t('nav.signOut')}
                  </MobileButton>
                </>
              ) : (
                <>
                  <MobileLink href={`/${locale}/sign-in`} onClick={() => setOpen(false)}>
                    <LogIn aria-hidden="true" size={16} strokeWidth={1.6} />
                    {t('nav.signIn')}
                  </MobileLink>
                  <MobileLink href={`/${locale}/sign-up`} onClick={() => setOpen(false)}>
                    <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.6} />
                    {t('nav.join')}
                  </MobileLink>
                </>
              )}
              {signOutError ? (
                <p role="alert" className="px-4 py-2 text-xs text-red-600 dark:text-red-300">
                  {signOutError}
                </p>
              ) : null}
            </div>
            <p className="dark:text-white/54 mt-2 px-4 pt-2 text-xs font-semibold uppercase text-zinc-500">
              {t('footer.locales')}
            </p>
            <div className="grid gap-1">
              <LocaleSwitcherLinks
                locale={locale}
                variant="topbar-mobile"
                onSelect={() => setOpen(false)}
              />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function AccountLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="dark:text-white/72 flex items-center gap-3 rounded px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white"
    >
      {children}
    </Link>
  );
}

function AccountButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dark:text-white/72 flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60 dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white"
    >
      {children}
    </button>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="dark:text-white/72 flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white"
    >
      {children}
    </Link>
  );
}

function MobileButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dark:text-white/72 flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white"
    >
      {children}
    </button>
  );
}
