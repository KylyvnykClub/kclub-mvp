import { Skeleton, Surface } from '@kclub/ui';

export default function OnboardingLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Surface className="kclub-panel max-w-none rounded-none px-6 py-8 shadow-none ring-0 sm:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-64" />
            <Skeleton className="mt-3 h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-[52px] w-full" />
          <Skeleton className="h-[52px] w-full" />
          <Skeleton className="h-[52px] w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Surface>
    </div>
  );
}
