import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchUserDetail } from '@/features/users/api';
import { UserDetailClient } from '@/features/users/components/user-detail-client';

type UserDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function UserDetailFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { id } = await params;
  const profile = await requireStaffProfile();
  const user = await fetchUserDetail(id);

  if (!user) {
    notFound();
  }

  return (
    <Suspense fallback={<UserDetailFallback />}>
      <UserDetailClient user={user} staffRole={profile.role} />
    </Suspense>
  );
}
