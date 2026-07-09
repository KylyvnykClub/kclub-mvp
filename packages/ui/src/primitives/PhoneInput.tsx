'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

import { cn } from '../classes';

export type { CountryCode };

export type PhoneInputChangeMeta = {
  isValid: boolean;
  country: CountryCode | undefined;
};

export type PhoneInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string, meta: PhoneInputChangeMeta) => void;
  onBlur?: () => void;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  'data-testid'?: string;
  'aria-describedby'?: string;
  renderFlag?: (country: CountryCode) => React.ReactNode;
};

function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function emojiFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const COUNTRIES: { code: CountryCode; name: string; callingCode: string }[] = getCountries()
  .map((code) => ({ code, name: regionName(code), callingCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_TRIGGER_CLASSES =
  'flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-2.5 text-sm text-zinc-900 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white';

const DEFAULT_INPUT_CLASSES =
  'block w-full min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white';

const DEFAULT_PANEL_CLASSES =
  'border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-zinc-900 dark:text-white';

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  defaultCountry = 'US',
  disabled,
  required,
  placeholder,
  autoComplete = 'tel',
  wrapperClassName,
  inputClassName,
  triggerClassName,
  panelClassName,
  renderFlag,
  ...rest
}: PhoneInputProps) {
  const reactId = useId();
  const inputId = id ?? reactId;

  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [nationalInput, setNationalInput] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastEmittedRef = useRef<string>('');

  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;

    if (!value) {
      setNationalInput('');
      return;
    }

    const parsed = parsePhoneNumberFromString(value, country);
    if (parsed) {
      if (parsed.country && parsed.country !== country) setCountry(parsed.country);
      setNationalInput(parsed.formatNational());
    } else {
      setNationalInput(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return;
      if (containerRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null);
      return;
    }

    const updatePosition = (): void => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPosition({ top: rect.bottom + 8, left: rect.left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.callingCode.includes(query) ||
        item.code.toLowerCase().includes(query),
    );
  }, [search]);

  const emitChange = (raw: string, nextCountry: CountryCode): void => {
    const formatted = new AsYouType(nextCountry).input(raw);
    setNationalInput(formatted);

    const parsed = parsePhoneNumberFromString(formatted, nextCountry);
    const nextValid = !!parsed && parsed.isValid();
    const nextValue = parsed?.number ?? formatted;
    lastEmittedRef.current = nextValue;
    onChange(nextValue, { isValid: nextValid, country: nextCountry });
  };

  const handleCountrySelect = (nextCountry: CountryCode): void => {
    setCountry(nextCountry);
    setOpen(false);
    setSearch('');
    emitChange(nationalInput.replace(/\D/g, ''), nextCountry);
  };

  const parsedForValidity = nationalInput.trim()
    ? parsePhoneNumberFromString(nationalInput, country)
    : undefined;
  const isValid = !nationalInput.trim() || !!parsedForValidity?.isValid();
  const showInvalid = touched && nationalInput.trim() !== '' && !isValid;

  const callingCode = getCountryCallingCode(country);

  return (
    <div className={cn('relative flex gap-2', wrapperClassName)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country code"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? DEFAULT_TRIGGER_CLASSES}
      >
        <span
          className="flex h-4 w-5 items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {renderFlag ? renderFlag(country) : emojiFlag(country)}
        </span>
        <span>+{callingCode}</span>
      </button>

      <input
        id={inputId}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={nationalInput}
        onChange={(e) => emitChange(e.target.value, country)}
        onBlur={() => {
          setTouched(true);
          onBlur?.();
        }}
        aria-invalid={showInvalid ? 'true' : 'false'}
        className={cn(
          inputClassName ?? DEFAULT_INPUT_CLASSES,
          showInvalid && 'ring-2 ring-red-500 focus-visible:ring-red-500',
        )}
        {...rest}
      />

      {open &&
        panelPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ top: panelPosition.top, left: panelPosition.left }}
            className={cn(
              'fixed z-50 max-h-72 w-72 overflow-hidden rounded-md border',
              panelClassName ?? DEFAULT_PANEL_CLASSES,
            )}
          >
            <div className="border-current/10 border-b p-2">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country"
                className="w-full rounded border-0 bg-transparent px-2 py-1.5 text-sm outline-none"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filteredCountries.map((item) => (
                <li key={item.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.code === country}
                    onClick={() => handleCountrySelect(item.code)}
                    className={cn(
                      'hover:bg-current/5 flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                      item.code === country && 'bg-current/5 font-semibold',
                    )}
                  >
                    <span
                      className="flex h-4 w-5 items-center justify-center overflow-hidden"
                      aria-hidden="true"
                    >
                      {renderFlag ? renderFlag(item.code) : emojiFlag(item.code)}
                    </span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="opacity-60">+{item.callingCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
