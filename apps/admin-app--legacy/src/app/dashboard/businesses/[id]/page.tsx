import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { requireStaffProfile } from '@/server/auth/profile';
import { fetchBusinessDetail } from '@/features/businesses/api';
import { BusinessDetailClient } from '@/features/businesses/components/business-detail-client';

type BusinessDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function BusinessDetailFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function BusinessDetailsPage({ params }: BusinessDetailsPageProps) {
  const { id } = await params;
  const profile = await requireStaffProfile();
  const business = await fetchBusinessDetail(id);

  if (!business) {
    notFound();
  }

  return (
    <Suspense fallback={<BusinessDetailFallback />}>
      <BusinessDetailClient business={business} staffRole={profile.role} />
    </Suspense>
  );
}
