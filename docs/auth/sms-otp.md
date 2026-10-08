# SMS OTP authentication

Grill.am supports two alternative sign-in methods. They are not combined into mandatory 2FA.

- Password: existing email and password login.
- SMS code: passwordless login for an existing account phone number.

Phone verification is a separate authenticated flow. A phone is verified only when `users.phone_verified_at` is set.

## Architecture

```text
Login UI
  |-- Password --> existing login action --> createSession()
  |-- SMS code --> request OTP --> MOBIPACE
                   verify OTP  --> createSession()

Profile
  request VERIFY_PHONE --> MOBIPACE --> verify OTP --> phone_verified_at
```

Auth code calls `src/lib/sms` and never the MOBIPACE HTTP client directly. MOBIPACE is only the SMS transport.

Password hashing, sessions, remember-me, roles, and post-login redirects stay on the existing session implementation. SMS login does not create an account.

## Flows

### Password login

Unchanged. An active user with a matching password receives a session. Suspended and anonymized users do not.

### SMS login

SMS login is allowed only for a `CUSTOMER` who is `ACTIVE` and whose current canonical phone already has `phone_verified_at` set. `ADMIN` and `OPERATOR` keep password login. An unverified phone is not an authentication credential.

Changing the canonical phone clears `phone_verified_at`. SMS login stays unavailable until `VERIFY_PHONE` succeeds for the new number.

1. The visitor submits a phone number.
2. The server normalizes it to E.164 (`+37499123456`).
3. Send limits are enforced (phone, IP, and a 60-second resend cooldown).
4. An OTP is sent only when exactly one account matches and that account is an active, verified customer.
5. The public response stays generic for unknown, unverified, inactive, staff, and ambiguous numbers: if an account exists for this phone number, a verification code has been sent. No SMS is sent in those cases, and no account is created.
6. Verification checks purpose `LOGIN`, expiry, attempt count, and the HMAC, then consumes the challenge with one conditional update.
7. The user is loaded again. `createSession()` runs only when the user is still a `CUSTOMER`, still `ACTIVE`, `phone_verified_at` is still set, and the canonical phone still matches the challenge. `last_login_at` is updated in that same success path.

### Phone verification

The signed-in user is taken from the server session. The client does not choose a user id.

`VERIFY_PHONE` codes do not log a user in, and `LOGIN` codes do not mark a phone verified. Changing the canonical phone clears `phone_verified_at`.

A partial unique index, `users_verified_phone_uidx`, allows only one account to hold a given verified phone. Unverified duplicates may remain. If a second account tries to verify the same number, the database rejects the write and the app returns a phone-taken error. The raw database error is not shown.

## OTP rules

| Rule | Value |
|---|---|
| Length | 6 digits from `crypto.randomInt` |
| TTL | 5 minutes |
| Attempts | 5 per challenge |
| Resend cooldown | 60 seconds per phone and purpose |
| Storage | HMAC-SHA256 with `OTP_SECRET` over `challengeId:phone:purpose:code` |
| Use | Single consume. A second success is impossible |

## Rate limits

Enforced in Redis. Production SMS uses shared Upstash only. The in-memory adapter is for development and tests. If production has MOBIPACE and `OTP_SECRET` but no Upstash, SMS actions stay unavailable and password login still works. SMS send fails closed if the limiter cannot be updated.

| Limit | Window |
|---|---|
| 5 sends | 15 minutes per phone and purpose |
| 20 sends | 15 minutes per IP |
| 1 resend | 60 seconds per phone and purpose |
| 15 verify attempts | 15 minutes per phone |
| 40 verify attempts | 15 minutes per IP |

The per-challenge attempt cap is in PostgreSQL and does not depend on Redis.

## MOBIPACE

HTTP API 4.0:

- `POST https://endpoint.mobipace.com:444/v4/Authorize`
- `POST https://endpoint.mobipace.com:444/v4/SendSMS`

The provider caches `SessionId` in Redis for 15 minutes (the vendor session expires 20 minutes after the last request). Status `102` and `103` clear the session and authorize once more. Status `104` means the account is busy, so the call is retried briefly. A Redis lock serializes this app's MOBIPACE calls because the vendor accepts one request at a time per account.

The lock is released with an atomic compare-and-delete (`EVAL`: delete only when the value is still this caller's token). A process whose lock expired cannot delete a newer owner's lock. The TTL is 120 seconds. That covers the worst vendor sequence inside the lock: two authorizations and five sends at a 12-second timeout each, plus the busy-retry delays, with margin. Production does not take this lock on the in-memory adapter.

Recipients are sent as international digits without `+` or `00` (`37499123456`). That conversion stays inside `src/lib/sms`.

Logs include status codes only. Credentials, session ids, and OTP codes are not logged. Provider errors are not shown to customers.

## Environment

| Variable | Notes |
|---|---|
| `OTP_SECRET` | Server-only HMAC key, at least 32 characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `MOBIPACE_USERNAME` | Existing MOBIPACE account username. |
| `MOBIPACE_PASSWORD` | Existing MOBIPACE account password. |
| `MOBIPACE_SMS_SENDER` | Registered sender name. |

Do not prefix these with `NEXT_PUBLIC_`. Password login keeps working when they are absent. SMS actions then return a generic error.

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are required in production when SMS OTP is enabled. Without them, SMS stays unavailable. Password login does not use this Redis. Development and tests may use the in-memory adapter.

## Data

Migration `0022_phone_otp.sql` adds `users.phone_verified_at` and `phone_otp_challenges`.

Issuing a new code consumes the previous active challenge and inserts the next one in a single SQL statement on the Neon HTTP driver. That statement is atomic. Commerce transactions still use the WebSocket helper in `src/db/transaction.ts`. `ws` stays external to the Next.js server bundle.

Migration `0023_phone_verified_unique.sql` adds a partial unique index on `users.phone` where `phone_verified_at` is set. It does not rewrite legacy phones and does not constrain unverified duplicates.

`users.phone` stays nullable. Historical values may be null, duplicated, or not E.164. New registration and profile saves store E.164. Login matches legacy forms of the same number (`099…`, `374…`, `00…`) and refuses to sign in when more than one active user matches, or when the match is not a verified customer.

New purposes such as `CHANGE_PHONE` or `PASSWORD_RESET` can be added to the `phone_otp_purpose` enum without reusing `LOGIN` or `VERIFY_PHONE` codes.

## Safe testing

Unit tests mock MOBIPACE with a fake `fetch`. They must not call the live endpoint.

To exercise the real provider in a non-production environment, set the MOBIPACE variables and `OTP_SECRET`, then request a code for a phone you control. Do not point tests at production credentials.
