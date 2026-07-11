import { Locale } from '@/i18n/routing';
import { AuthForm } from './AuthForm';

export function SignUpForm({ locale }: { locale: Locale }) {
  return <AuthForm locale={locale} mode="sign-up" />;
}
