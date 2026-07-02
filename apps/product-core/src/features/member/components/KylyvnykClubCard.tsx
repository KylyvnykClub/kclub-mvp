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
        className,
      )}
      style={{
        background: [
          'radial-gradient(ellipse 80% 65% at 50% 44%, rgba(255,240,170,0.55) 0%, rgba(255,240,170,0) 100%)',
          'repeating-radial-gradient(ellipse 100% 85% at 50% 44%, transparent 0px, transparent 2px, rgba(180,140,30,0.07) 2.5px, transparent 3px)',
          'repeating-radial-gradient(ellipse 100% 85% at 50% 44%, transparent 0px, transparent 5px, rgba(200,160,40,0.06) 5.5px, transparent 6px)',
          'repeating-radial-gradient(ellipse 100% 85% at 50% 44%, transparent 0px, transparent 9px, rgba(160,120,25,0.05) 9.5px, transparent 10px)',
          'radial-gradient(ellipse 120% 100% at 50% 44%, #f2dc82 0%, #dbbf4a 15%, #caa83a 30%, #b89230 48%, #9a7824 64%, #7c5e1c 80%, #5c4414 100%)',
        ].join(', '),
      }}
    >
      {/* SVG brushed-metal circular texture */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <filter id="brushed-metal" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.2 0.015"
              numOctaves={5}
              seed={7}
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
            <feComponentTransfer in="mono" result="contrast">
              <feFuncR type="linear" slope={1.8} intercept={-0.35} />
              <feFuncG type="linear" slope={1.8} intercept={-0.35} />
              <feFuncB type="linear" slope={1.8} intercept={-0.35} />
              <feFuncA type="linear" slope={0.28} intercept={0} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#brushed-metal)" style={{ mixBlendMode: 'overlay' }} />
      </svg>

      {/* Concentric shine rings */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 55% 45% at 50% 42%, rgba(255,245,200,0.45) 0%, transparent 100%)',
            'radial-gradient(ellipse 85% 68% at 50% 43%, transparent 36%, rgba(240,210,100,0.18) 44%, transparent 52%)',
            'radial-gradient(ellipse 120% 95% at 50% 43%, transparent 34%, rgba(220,185,60,0.14) 40%, transparent 46%)',
            'radial-gradient(ellipse 170% 135% at 50% 43%, transparent 32%, rgba(200,160,45,0.11) 37%, transparent 42%)',
            'radial-gradient(ellipse 230% 180% at 50% 43%, transparent 30%, rgba(180,140,35,0.09) 34%, transparent 38%)',
            'radial-gradient(ellipse 310% 240% at 50% 43%, transparent 28%, rgba(160,120,25,0.07) 31%, transparent 34%)',
          ].join(', '),
        }}
      />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: 'inset 0 0 50px 12px rgba(50,35,8,0.45)' }}
      />

      <div className="absolute inset-0 p-2">
        <div className="relative flex h-full w-full flex-col justify-between rounded-xl border border-[#e6c975] shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">

          {/* Logo and Branding */}
          <div className="mt-4 flex flex-col items-center">
            <Image
              src={cardLogo}
              alt="Kylyvnyk Club Logo"
              className="h-16 w-16 object-contain drop-shadow-md"
            />
            <div className="mt-2 text-3xl font-serif tracking-widest">
              <span
                style={{
                  color: '#4a3210',
                  textShadow:
                    '0 1px 0 rgba(220,190,90,0.8), 0 2px 1px rgba(220,190,90,0.3), 0 -1px 0 rgba(30,20,5,0.6), -1px 0 0 rgba(30,20,5,0.15), 1px 0 0 rgba(220,190,90,0.15)',
                }}
              >
                KYLYVNYK
              </span>
            </div>
            <div
              className="mt-1 text-[10px] font-sans font-bold uppercase tracking-[0.3em]"
              style={{
                color: '#4a3510',
                textShadow: '0 1px 0 rgba(220,190,90,0.7), 0 -1px 0 rgba(30,20,5,0.4)',
              }}
            >
              BUSINESS CLUB
            </div>
          </div>

          {/* User Data */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div
              className="text-3xl font-bold uppercase tracking-widest"
              style={{
                color: '#1a1200',
                textShadow:
                  '0 1px 0 rgba(220,190,90,0.7), 0 2px 1px rgba(220,190,90,0.25), 0 -1px 0 rgba(30,20,5,0.45)',
              }}
            >
              {name}
            </div>
            <div
              className="mt-1 text-xl font-medium uppercase tracking-widest"
              style={{
                color: '#2a1e08',
                textShadow: '0 1px 0 rgba(220,190,90,0.6), 0 -1px 0 rgba(30,20,5,0.35)',
              }}
            >
              {status}
            </div>
          </div>

          {/* Footer */}
          <div className="flex w-full items-end justify-between px-8 pb-6">
            <div
              className="text-sm font-medium uppercase tracking-widest"
              style={{
                color: '#2a1e08',
                textShadow: '0 1px 0 rgba(220,190,90,0.5), 0 -1px 0 rgba(30,20,5,0.3)',
              }}
            >
              ID: {idNumber.slice(-9)}
            </div>
            <div
              className="text-sm font-medium uppercase tracking-widest"
              style={{
                color: '#2a1e08',
                textShadow: '0 1px 0 rgba(220,190,90,0.5), 0 -1px 0 rgba(30,20,5,0.3)',
              }}
            >
              VALID UNTIL: {validDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
