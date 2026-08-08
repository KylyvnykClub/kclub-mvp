'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

type BusinessOption = {
  id: string;
  name: string;
};

export type IntroductionSubmitFormProps = {
  businessOptions: BusinessOption[];
};

export function IntroductionSubmitForm({ businessOptions }: IntroductionSubmitFormProps) {
  useTranslations('member.dashboard.introductions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState({
    fullName: '',
    phone: '',
    email: '',
    businessId: '',
    context: '',
  });

  const set = (key: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName || (!data.phone && !data.email) || !data.businessId) return;

    setIsSubmitting(true);
    setError(null);

    const clientContactParts = [];
    if (data.phone) clientContactParts.push(data.phone);
    if (data.email) clientContactParts.push(data.email);

    try {
      const res = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBusinessId: data.businessId,
          clientName: data.fullName,
          clientContact: clientContactParts.join(' / '),
          message: data.context || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setDone(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div
        className="flex flex-col items-center justify-center border border-border bg-background p-12 text-center shadow-lg"
        data-testid="intro-submit-success"
      >
        <h2 className="mb-4 text-2xl font-semibold text-accent">Recommendation Submitted</h2>
        <p className="text-muted-foreground">
          Thank you. The partner will review your client recommendation shortly.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full border border-border bg-background py-3 px-4 text-[15px] text-foreground transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const textareaClasses =
    'w-full border border-border bg-background py-3 px-4 text-[15px] text-foreground transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none';
  const selectClasses =
    'w-full appearance-none border border-border bg-background py-3 px-4 text-[15px] text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-12">
      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="border border-border bg-background p-10 shadow-lg">
        <h2 className="mb-8 border-b border-border pb-4 text-lg font-semibold uppercase tracking-widest text-accent">
          Client Information
        </h2>
        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <input
              data-testid="intro-client-name"
              id="fullName"
              type="text"
              placeholder="e.g. Alexander Sterling"
              className={inputClasses}
              value={data.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
                htmlFor="phoneNumber"
              >
                Phone Number
              </label>
              <input
                data-testid="intro-client-phone"
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className={inputClasses}
                value={data.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
                htmlFor="emailAddress"
              >
                Email Address
              </label>
              <input
                id="emailAddress"
                type="email"
                placeholder="alexander@domain.com"
                className={inputClasses}
                value={data.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border bg-background p-10 shadow-lg">
        <h2 className="mb-8 border-b border-border pb-4 text-lg font-semibold uppercase tracking-widest text-accent">
          Service Requisition
        </h2>
        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="targetCategory"
            >
              Target Partner
            </label>
            <div className="relative">
              <select
                data-testid="intro-target-business"
                id="targetCategory"
                className={selectClasses}
                value={data.businessId}
                onChange={(e) => set('businessId', e.target.value)}
                required
              >
                <option value="" disabled className="text-muted">
                  Select a partner...
                </option>
                {businessOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-accent">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="context"
            >
              Recommendation Context
            </label>
            <textarea
              data-testid="intro-message"
              id="context"
              rows={5}
              placeholder="Provide brief context regarding the client's needs and your relationship..."
              className={textareaClasses}
              value={data.context}
              onChange={(e) => set('context', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          data-testid="intro-submit"
          type="submit"
          disabled={
            isSubmitting || !data.fullName || (!data.phone && !data.email) || !data.businessId
          }
          className="hover:bg-accent/90 flex items-center gap-2 bg-accent px-10 py-4 text-[13px] font-medium uppercase tracking-[0.2em] text-zinc-950 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Spinner size={18} /> : null}
          Submit Recommendation
        </button>
      </div>
    </form>
  );
}
