'use client';

import { AlertTriangle } from 'lucide-react';
import { Button, PageState } from '@kclub/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageState
      icon={<AlertTriangle aria-hidden="true" size={48} strokeWidth={1.5} />}
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred.'}
      action={
        <Button color="primary" onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
