import { redirect } from 'next/navigation';

export default function AuditPage() {
  redirect('/dashboard/settings?section=audit');
}
