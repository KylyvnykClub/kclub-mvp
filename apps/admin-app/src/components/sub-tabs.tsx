'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

export type SubTabItem = {
  id: string;
  label: string;
};

type SubTabsProps = {
  tabs: SubTabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
  const handleClick = useCallback(
    (id: string) => {
      onTabChange(id);
      const url = new URL(window.location.href);
      url.searchParams.set('section', id);
      history.replaceState(null, '', url.toString());
    },
    [onTabChange],
  );

  return (
    <div className="flex gap-1 overflow-x-auto border-b pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleClick(tab.id)}
          className={cn(
            'shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-b-2 border-primary bg-background text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
