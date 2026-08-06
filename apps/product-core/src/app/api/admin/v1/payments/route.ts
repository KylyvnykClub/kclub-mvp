import { type NextRequest } from 'next/server';
import { STAFF_PERMISSIONS, type AdminPaymentDto } from '@kclub/contracts';
import { adminGuard } from '@/server/admin-guard';
import { jsonSuccess, jsonErrorFromUnknown } from '@/server/api';
import { getStripeClient } from '@/server/stripe/client';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    await adminGuard(request, STAFF_PERMISSIONS.FINANCE_METRICS_READ);
    
    const stripe = getStripeClient();
    const charges = await stripe.charges.list({
      limit: 100,
      expand: ['data.customer'],
    });
    
    const payments: AdminPaymentDto[] = charges.data.map((charge) => {
      let customerEmail: string | null = null;
      let customerName: string | null = null;

      if (charge.customer && typeof charge.customer !== 'string') {
        const customer = charge.customer as Stripe.Customer;
        customerEmail = customer.email || null;
        customerName = customer.name || null;
      }
      
      // Fallback to billing details if customer object doesn't have it
      if (!customerEmail && charge.billing_details?.email) {
        customerEmail = charge.billing_details.email || null;
      }
      if (!customerName && charge.billing_details?.name) {
        customerName = charge.billing_details.name || null;
      }

      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created_at: new Date(charge.created * 1000).toISOString(),
        description: charge.description,
        receipt_url: charge.receipt_url,
        customer_email: customerEmail,
        customer_name: customerName,
      };
    });

    return jsonSuccess(payments);
  } catch (error) {
    return jsonErrorFromUnknown(error);
  }
}
