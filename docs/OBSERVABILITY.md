# Observability

This document defines the minimum observability baseline for launch.

## Logging

Use structured logs for:

- API errors
- auth failures
- webhook processing
- cron execution
- admin state-changing actions
- deployment and startup failures

Logs must avoid:

- OTP values
- TOTP secrets
- tokens
- service-role keys
- payment secrets

## Correlation

Where possible, include:

- request id
- actor id
- role
- route
- environment
- Stripe event id for webhook logs

## Health Checks

Support at least:

- app boot success
- health/readiness endpoint
- database connectivity check if safe
- webhook route availability

## Monitoring Expectations

Recommended signals:

- 5xx rate on product-core
- 5xx rate on admin-app
- auth failure spikes
- webhook failure count
- cron failure count
- checkout start without follow-up webhook completion within expected window

## Performance Baseline

Before a performance change, capture a production or Vercel Preview baseline for
the public home page, directory, and member dashboard. Record the tested URL,
device/network profile, cache state, and timestamp with the results.

Run the product-core bundle analyzer locally with:

```bash
pnpm --filter @kclub/product-core analyze
```

The command writes client and server bundle reports to the app build output. Do
not treat the analyzer alone as a user-perceived performance result; compare it
with Lighthouse and field Web Vitals on the same route.

### Field Web Vitals

When `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is configured, product-core sends LCP, CLS,
and INP to Plausible as non-interactive `WebVital` events. The event properties
are `metric`, `rating`, and rounded `value`; they do not include user identity,
page URL, or request data. Configure a matching `WebVital` custom-event goal in
Plausible before relying on the dashboard for performance monitoring.

## Alert Priorities

High:

- webhook failures
- admin auth failures across many users
- production 5xx spike
- public PII leak or auth bypass

Medium:

- cron failures
- elevated validation errors
- sustained business placement publication lag

Low:

- isolated UX/client errors with workaround

## Production Monitoring Configuration (Placeholders)

The following are placeholder structures for wiring up alerts in Vercel or an
external monitoring provider. None are active until configured by the deployment
operator.

### Environment Variables Required

| Variable                | Purpose                                                    | App                     |
| ----------------------- | ---------------------------------------------------------- | ----------------------- |
| `LOG_LEVEL`             | Pino log level (`info` in production, `debug` locally)     | product-core, admin-app |
| `CRON_SECRET`           | Authorization token for the daily-maintenance cron trigger | product-core            |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification                      | product-core            |

### Vercel Log Drain Filter Fields

When a log drain is configured, the following structured fields are available
for filter rules:

- `domain: "webhook"` — all Stripe webhook events
- `domain: "cron"` — all cron execution events
- `domain: "auth"` — all authentication failures
- `domain: "admin"` — all admin state-changing actions
- `level: "error"` — all error-level entries
- `data.eventId` — Stripe event ID (webhook logs)
- `data.requestId` — correlation ID (all request-scoped logs)

### Alert Thresholds (placeholder — not yet active)

```
# High priority — page immediately
webhook_processing_errors > 0 in 5min window
auth_failures_distinct_users > 5 in 10min window
product_core_5xx_rate > 1% over 5min

# Medium priority — notify on-call
cron_failure_count > 0 (any daily-maintenance failure)
admin_app_5xx_rate > 1% over 5min
backend_health_status = "unreachable" for > 2min

# Low priority — review async
validation_error_rate > 5% over 1hr
```

### Health Check URLs

| Endpoint          | App                      | Checks                              |
| ----------------- | ------------------------ | ----------------------------------- |
| `GET /api/health` | product-core (port 3000) | app boot, database connectivity     |
| `GET /api/health` | admin-app (port 3001)    | app boot, product-core reachability |
