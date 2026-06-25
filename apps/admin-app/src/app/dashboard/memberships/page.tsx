import { redirect } from 'next/navigation';

export default function MembershipsPage() {
  redirect('/dashboard/billing?section=memberships');
}
