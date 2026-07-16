import { AuthForm } from './AuthForm';
import { Locale } from '@/i18n/routing';

export function PasswordRecoveryForm({ locale }: { locale: Locale }) {
  return <AuthForm locale={locale} mode="password-recovery" />;
}
