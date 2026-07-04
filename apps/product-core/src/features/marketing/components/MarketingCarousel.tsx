'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { IconButton } from '@kclub/ui';

const CAROUSEL_ITEM_SELECTOR = '[data-marketing-carousel-item]';

export type MarketingCarouselLabels = {
  navigation: string;
  previous: string;
  next: string;
};

export type MarketingCarouselProps = {
  header: ReactNode;
  labels: MarketingCarouselLabels;
  children: ReactNode;
  itemCount: number;
};

function getCardScrollLeft(container: HTMLElement, card: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();

  return container.scrollLeft + (cardRect.left - containerRect.left);
}

export function MarketingCarousel({ header, labels, children, itemCount }: MarketingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const getCards = useCallback((): HTMLElement[] => {
    const container = scrollRef.current;
    if (!container) {
      return [];
    }

    return Array.from(container.querySelectorAll<HTMLElement>(CAROUSEL_ITEM_SELECTOR));
  }, []);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const cards = getCards();
    if (cards.length === 0) {
      return;
    }

    const scrollLeft = container.scrollLeft;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const targetScrollLeft = getCardScrollLeft(container, card);
      const distance = Math.abs(targetScrollLeft - scrollLeft);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    activeIndexRef.current = nearestIndex;
    setCanScrollPrev(nearestIndex > 0);
    setCanScrollNext(nearestIndex < cards.length - 1);
  }, [getCards]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [itemCount, updateScrollState]);

  const goToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) {
        return;
      }

      const cards = getCards();
      if (cards.length === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(index, cards.length - 1));
      const card = cards[clampedIndex];
      if (!card) {
        return;
      }

      const targetScrollLeft = getCardScrollLeft(container, card);
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      activeIndexRef.current = clampedIndex;
      setCanScrollPrev(clampedIndex > 0);
      setCanScrollNext(clampedIndex < cards.length - 1);
    },
    [getCards],
  );

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        {header}

        <div aria-label={labels.navigation} className="flex shrink-0 items-center gap-3">
          <IconButton
            aria-label={labels.previous}
            className="!bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canScrollPrev}
            onClick={() => {
              goToIndex(activeIndexRef.current - 1);
            }}
            type="button"
          >
            <ChevronLeft aria-hidden size={16} />
          </IconButton>
          <IconButton
            aria-label={labels.next}
            className="!bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canScrollNext}
            onClick={() => {
              goToIndex(activeIndexRef.current + 1);
            }}
            type="button"
          >
            <ChevronRight aria-hidden size={16} />
          </IconButton>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="kclub-hide-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {children}
      </div>
    </>
  );
}
