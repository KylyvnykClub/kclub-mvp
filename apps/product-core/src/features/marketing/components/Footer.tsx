import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import crowLogo from '@/assets/logo/crow--logo.png';
import { Locale } from '@/i18n/routing';

import { LocaleSwitcherLinks } from './LocaleSwitcherLinks';
import { ThemeToggle } from './ThemeToggle';

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations('home');
  const year = new Date().getFullYear();
  const linkGroups = [
    {
      title: t('footer.links'),
      links: [
        { label: t('footer.directory'), href: `/${locale}/directory` },
        { label: t('footer.signUp'), href: `/${locale}/sign-up` },
        { label: t('footer.signIn'), href: `/${locale}/sign-in` },
        { label: t('footer.verifyCard'), href: `/${locale}/verify-card` },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: t('footer.terms'), href: `/${locale}/terms` },
        { label: t('footer.privacy'), href: `/${locale}/privacy` },
      ],
    },
  ];

  return (
    <footer className="kclub-border border-t bg-zinc-100 text-zinc-950 dark:bg-surface dark:text-white">
      <div className="kclub-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="inline-flex items-center gap-3 text-sm font-bold uppercase">
            <Image
              src={crowLogo}
              alt=""
              aria-hidden="true"
              className="block h-10 w-10 rounded-full object-cover"
            />
            {t('brand')}
          </h2>
          <p className="dark:text-white/64 mt-5 text-sm font-medium leading-7 text-zinc-600">
            {t('footer.aboutText')}
          </p>
        </div>
        {linkGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-bold uppercase text-zinc-500 dark:text-white/50">
              {group.title}
            </h3>
            <ul className="mt-5 grid gap-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="dark:text-white/68 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:text-white dark:focus-visible:ring-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-xs font-bold uppercase text-zinc-500 dark:text-white/50">
            {t('footer.locales')}
          </h3>
          <LocaleSwitcherLinks locale={locale} variant="footer" />
        </div>
      </div>
      <div className="kclub-border border-t">
        <div className="kclub-shell dark:text-white/54 flex flex-col gap-4 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {year} {t('brand')}. {t('footer.copyright')}
          </p>
          <ThemeToggle className="h-10 w-10" />
        </div>
      </div>
    </footer>
  );
}
