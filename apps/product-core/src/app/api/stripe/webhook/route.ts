import { ERROR_CODES } from '@kclub/contracts';

import { getStripeClient } from '@/server/stripe/client';
import { readStripeEnv } from '@/server/stripe/env';
import { jsonError } from '@/server/api';
import { createLogger } from '@/server/logger';

const log = createLogger();

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return jsonError(
      {
        code: ERROR_CODES.SERVER_STRIPE_WEBHOOK_INVALID,
        message: 'Missing stripe-signature header',
      },
      undefined,
      { status: 400 },
    );
  }

  let env;
  try {
    env = readStripeEnv();
  } catch (error) {
    return jsonError(
      { code: ERROR_CODES.SERVER_ERROR, message: 'Server configuration error' },
      undefined,
      { status: 500 },
    );
  }

  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    log.webhook('Stripe signature validation failed', {
      signatureTruncated: signature.slice(0, 16),
    });
    return jsonError(
      { code: ERROR_CODES.SERVER_STRIPE_WEBHOOK_INVALID, message: 'Invalid stripe signature' },
      undefined,
      { status: 400 },
    );
  }

  try {
    const { processStripeEvent } = await import('@/server/services/webhook-service');
    await processStripeEvent(event);
    log.webhook('Stripe event processed', { eventId: event.id, eventType: event.type });
    return new Response(null, { status: 200 });
  } catch (error) {
    log.error('Stripe event processing failed', {
      domain: 'webhook',
      eventId: event.id,
      eventType: event.type,
      error,
    });
    return new Response(null, { status: 500 });
  }
}
