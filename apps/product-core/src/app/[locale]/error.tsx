'use client';

import { ServerOff } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Button, PageState } from '@kclub/ui';

const SERVICE_UNAVAILABLE_COPY = {
  en: {
    title: 'Service temporarily unavailable',
    description: 'We could not load the data right now. Please try again in a few minutes.',
    retry: 'Try again',
  },
  ru: {
    title: 'Сервис временно недоступен',
    description: 'Сейчас не удалось загрузить данные. Попробуйте ещё раз через несколько минут.',
    retry: 'Попробовать снова',
  },
  uk: {
    title: 'Сервіс тимчасово недоступний',
    description: 'Зараз не вдалося завантажити дані. Спробуйте ще раз за кілька хвилин.',
    retry: 'Спробувати знову',
  },
} as const;

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale === 'ru' || params.locale === 'uk' ? params.locale : 'en';
  const copy = SERVICE_UNAVAILABLE_COPY[locale];

  return (
    <PageState
      icon={<ServerOff aria-hidden="true" size={48} strokeWidth={1.5} />}
      title={copy.title}
      description={copy.description}
      action={
        <Button color="primary" onClick={() => reset()}>
          {copy.retry}
        </Button>
      }
    />
  );
}
