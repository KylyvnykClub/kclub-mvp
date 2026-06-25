export const cabinetRootClasses =
  'flex min-h-[calc(100vh-5.5rem)] flex-col bg-background text-foreground lg:-mx-10 lg:w-[calc(100%+5rem)] lg:flex-row';

export const cabinetUserBarClasses =
  'flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3 sm:px-10';

export const cabinetTopTabsNavClasses =
  'flex shrink-0 gap-0 overflow-x-auto border-b border-border bg-surface px-4 sm:px-8';

export const cabinetTopTabItemClasses =
  'flex shrink-0 items-center px-4 py-3.5 text-sm font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export const cabinetTopTabItemActiveClasses =
  'border-b-2 border-accent text-foreground';

export const cabinetTopTabItemInactiveClasses =
  'border-b-2 border-transparent text-muted-foreground hover:text-foreground';

export const cabinetNavItemLockedClasses = 'text-muted';

export const cabinetSidebarClasses =
  'hidden w-full shrink-0 flex-col border-b border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-[calc(100vh-5.5rem)] lg:w-60 lg:border-b-0 lg:border-r';

export const cabinetMobileNavClasses =
  'flex gap-0 overflow-x-auto border-b border-border bg-surface lg:hidden';

export const cabinetNavItemClasses =
  'flex shrink-0 items-center justify-between gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export const cabinetNavItemActiveClasses =
  'border-l-2 border-accent bg-surface-muted text-foreground';

export const cabinetNavItemInactiveClasses =
  'border-l-2 border-transparent text-muted-foreground hover:text-foreground';

export const cabinetLockTagClasses =
  'inline-flex border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted';

export const cabinetMainClasses = 'flex min-w-0 flex-1 flex-col';

export const cabinetHeaderClasses =
  'sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-6 sm:px-12';

export const cabinetContentClasses = 'flex-1 px-6 py-10 sm:px-12';

export const cabinetSectionLabelClasses =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted';

export const cabinetFieldLabelClasses =
  'mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted';

export const cabinetPanelClasses = 'border border-border bg-surface-muted p-8';

export const cabinetGridPanelClasses = 'border border-border bg-surface-muted p-7 sm:p-8';

export const cabinetLockedStateClasses =
  'flex min-h-[400px] flex-col items-center justify-center px-10 py-20 text-center';

export const memberCabinetPanelClasses = cabinetPanelClasses;

export const memberInfoTileClasses =
  'border border-border bg-surface-muted p-4 text-foreground';
