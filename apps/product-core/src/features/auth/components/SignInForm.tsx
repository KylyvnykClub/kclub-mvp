import { Locale } from '@/i18n/routing';
import { AuthForm } from './AuthForm';

export function SignInForm({ locale }: { locale: Locale }) {
  return <AuthForm locale={locale} mode="sign-in" />;
}
