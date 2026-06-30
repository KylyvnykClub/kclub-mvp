import Image from 'next/image';
import { cn } from '@kclub/ui';

import cardLogo from '@/assets/card-logo.png';

export type KylyvnykClubCardProps = {
  name?: string;
  status?: string;
  idNumber?: string;
  validDate?: string;
  className?: string;
};

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
        'relative shrink-0 overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.58/1] w-full max-w-[400px] lg:max-w-[450px]',
        'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ebd478] via-[#b8962c] to-[#5c4017]',
        className,
      )}
    >
      <div className="absolute inset-0 p-2">
        <div className="relative flex h-full w-full flex-col justify-between rounded-xl border border-[#e6c975] shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
          
          {/* Logo and Branding (Top Center) */}
          <div className="mt-4 flex flex-col items-center">
            <Image 
              src={cardLogo} 
              alt="Kylyvnyk Club Logo" 
              className="h-16 w-16 object-contain drop-shadow-md" 
            />
            <div className="mt-2 text-3xl font-serif tracking-widest">
              <span className="bg-gradient-to-b from-[#75521a] to-[#c29b38] bg-clip-text text-transparent drop-shadow-sm">
                KYLYVNYK
              </span>
            </div>
            <div className="mt-1 text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#5c400d]">
              BUSINESS CLUB
            </div>
          </div>

          {/* User Data (Center) */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="text-3xl font-bold uppercase tracking-widest text-[#111]">
              {name}
            </div>
            <div className="mt-1 text-xl font-medium uppercase tracking-widest text-black">
              {status}
            </div>
          </div>

          {/* Footer (Bottom) */}
          <div className="flex w-full items-end justify-between px-8 pb-6">
            <div className="text-sm font-medium uppercase tracking-widest text-black">
              ID: {idNumber.slice(-9)}
            </div>
            <div className="text-sm font-medium uppercase tracking-widest text-black">
              VALID UNTIL: {validDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
