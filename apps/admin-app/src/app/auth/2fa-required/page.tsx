import { redirect } from 'next/navigation';

export default function TwoFactorRequiredPage(): never {
  redirect('/auth/mfa');
}
