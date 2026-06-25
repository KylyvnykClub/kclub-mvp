import { redirect } from 'next/navigation';

export default function StripePricesPage() {
  redirect('/dashboard/billing?section=stripe-prices');
}
