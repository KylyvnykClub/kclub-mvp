import { redirect } from 'next/navigation';

export default function TotpSetupPage(): never {
  redirect('/auth/sign-in');
}
