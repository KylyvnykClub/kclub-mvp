import Image from 'next/image';
import { cn } from '@kclub/ui';

import cardLogo from '@/assets/logo/card-logo.png';

export type KylyvnykClubCardProps = {
  name?: string;
  status?: string;
  idNumber?: string;
  validDate?: string;
  className?: string;
};

const CARD_BG =
  'linear-gradient(180deg, #f2dc82 0%, #dbbf4a 15%, #caa83a 35%, #b89230 60%, #9a7824 85%, #7c5e1c 100%)';

const CARD_TEXT = {
  color: '#2a1e08',
  textShadow: '0 1px 0 rgba(220,190,90,0.6), 0 -1px 0 rgba(30,20,5,0.25)',
} as const;

const CARD_TEXT_BOLD = {
  color: '#1a1200',
  textShadow:
    '0 1px 0 rgba(220,190,90,0.7), 0 2px 1px rgba(220,190,90,0.25), 0 -1px 0 rgba(30,20,5,0.4)',
} as const;

export function KylyvnykClubCard({
  name = 'ALEXANDER ROMANOV',
  status = 'VIP MEMBER',
  idNumber = '892 345 102',
  validDate = '12/2025',
  className,
}: KylyvnykClubCardProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg',
        'aspect-[1.58/1] w-full max-w-full sm:max-w-[400px] lg:max-w-[450px]',
        className,
      )}
      style={{
        background: CARD_BG,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,245,200,0.4)',
        border: '1px solid #b89230',
      }}
    >
      {/* Inner border frame */}
      <div className="absolute inset-1.5 rounded-md border border-[#e6c975]/50 sm:inset-2" />

      {/* Subtle top shine */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(255,245,200,0.25) 0%, transparent 40%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        {/* Logo and Branding */}
        <div className="flex min-w-0 flex-col items-center">
          <Image
            src={cardLogo}
            alt="Kylyvnyk Club Logo"
            className="h-10 w-10 object-contain drop-shadow-md sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          />
          <div className="mt-1 max-w-full truncate px-3 font-serif text-xl tracking-widest sm:mt-2 sm:text-2xl lg:text-3xl">
            <span style={CARD_TEXT_BOLD}>KYLYVNYK</span>
          </div>
          <div
            className="mt-0.5 max-w-full truncate px-3 font-sans text-xs font-semibold uppercase tracking-widest sm:mt-1"
            style={CARD_TEXT}
          >
            BUSINESS CLUB
          </div>
        </div>

        {/* User Data */}
        <div className="flex min-w-0 flex-col items-center justify-center px-4">
          <div
            className="max-w-full truncate text-center text-lg font-semibold uppercase tracking-widest sm:text-2xl lg:text-3xl"
            style={CARD_TEXT_BOLD}
          >
            {name}
          </div>
          <div
            className="mt-0.5 max-w-full truncate text-center text-sm font-medium uppercase tracking-widest sm:mt-1 sm:text-lg lg:text-xl"
            style={CARD_TEXT}
          >
            {status}
          </div>
        </div>

        {/* Footer */}
        <div className="grid w-full grid-cols-[minmax(0,0.9fr)_minmax(max-content,1.1fr)] items-end gap-2 px-2 sm:px-4">
          <div
            className="min-w-0 whitespace-nowrap text-xs font-medium uppercase tracking-normal sm:text-sm sm:tracking-wide lg:tracking-widest"
            style={CARD_TEXT}
          >
            ID: {idNumber.slice(-9)}
          </div>
          <div
            className="min-w-max whitespace-nowrap text-right text-xs font-medium uppercase tracking-normal sm:text-sm sm:tracking-wide lg:tracking-widest"
            style={CARD_TEXT}
          >
            VALID UNTIL: {validDate}
          </div>
        </div>
      </div>
    </div>
  );
}
