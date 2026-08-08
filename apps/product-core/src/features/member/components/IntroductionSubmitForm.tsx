'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

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
  const t = useTranslations('member.dashboard.introductions');
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center border border-border bg-background p-12 text-center shadow-lg">
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
    <form onSubmit={handleSubmit} className="space-y-12 max-w-3xl">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="bg-background border border-border p-10 shadow-lg">
        <h2 className="text-lg font-semibold text-accent mb-8 pb-4 border-b border-border uppercase tracking-widest">
          Client Information
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-muted-foreground uppercase mb-2" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Alexander Sterling"
              className={inputClasses}
              value={data.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground uppercase mb-2" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className={inputClasses}
                value={data.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground uppercase mb-2" htmlFor="emailAddress">
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

      <div className="bg-background border border-border p-10 shadow-lg">
        <h2 className="text-lg font-semibold text-accent mb-8 pb-4 border-b border-border uppercase tracking-widest">
          Service Requisition
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-muted-foreground uppercase mb-2" htmlFor="targetCategory">
              Target Partner
            </label>
            <div className="relative">
              <select
                id="targetCategory"
                className={selectClasses}
                value={data.businessId}
                onChange={(e) => set('businessId', e.target.value)}
                required
              >
                <option value="" disabled className="text-muted">Select a partner...</option>
                {businessOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-muted-foreground uppercase mb-2" htmlFor="context">
              Recommendation Context
            </label>
            <textarea
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

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !data.fullName || (!data.phone && !data.email) || !data.businessId}
          className="flex items-center gap-2 bg-accent px-10 py-4 text-[13px] font-medium uppercase tracking-[0.2em] text-zinc-950 transition-all hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Spinner size={18} /> : null}
          Submit Recommendation
        </button>
      </div>
    </form>
  );
}
