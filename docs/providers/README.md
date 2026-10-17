# Delivery providers

Provider integrations live in `src/lib/delivery-providers/`.

- `types.ts` defines the `DeliveryProvider` contract (id, label,
  `testConnection`, `createShipment`).
- `registry.ts` maps provider ids to implementations.
- One stub exists today: `ecotrack` (`ecotrack.ts`). Its methods throw
  `Not implemented: see docs/providers/ecotrack.md`.

## Adding a provider

1. Read the provider's **official** API documentation first. Do not guess
   request/response formats.
2. Add a doc file: `docs/providers/<provider>.md` with the endpoints,
   auth scheme, payloads and error codes.
3. Implement `src/lib/delivery-providers/<provider>.ts` against the
   `DeliveryProvider` interface. Keep secrets out of logs and out of any
   client bundle.
4. Register it in `registry.ts` (extend `DeliveryProviderId` in
   `types.ts`).
5. Add admin settings under `/admin/settings`: store credentials with the
   service role in `public.store_settings` (never return them in full —
   mask to the last 4 characters).
6. Add unit tests for pure mapping/validation logic.

## Security rules

- `store_settings` has RLS enabled, no policies and no grants to
  `anon`/`authenticated`. Service role only.
- Every server action must call `requireAdmin()` and the rate limiter.
- Never log credentials, never expose them in `NEXT_PUBLIC_*`, never send
  them to the browser unmasked.
