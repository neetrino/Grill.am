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

1. The visitor submits a phone number.
2. The server normalizes it to E.164 (`+37499123456`).
3. Send limits are enforced (phone, IP, and a 60-second resend cooldown).
4. If exactly one active account matches that number, a 6-digit OTP is stored as an HMAC and sent by SMS.
5. The public response is always: if an account exists for this phone number, a verification code has been sent.
6. Unknown, inactive, or ambiguous numbers do not create users and do not reveal whether an account exists.
7. Verification checks purpose `LOGIN`, expiry, attempt count, and the HMAC, then consumes the challenge with one conditional update.
8. The user is loaded again. Only an `ACTIVE` user whose phone still matches receives `createSession()` and a `last_login_at` update.

### Phone verification

The signed-in user is taken from the server session. The client does not choose a user id.

`VERIFY_PHONE` codes do not log a user in, and `LOGIN` codes do not mark a phone verified. Changing the canonical phone clears `phone_verified_at`.

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

Enforced in Redis (Upstash when configured, in-memory adapter otherwise). SMS send fails closed if the limiter cannot be updated.

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

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` should be set in production so limits and the MOBIPACE lock are shared across instances.

## Data

Migration `0022_phone_otp.sql` adds `users.phone_verified_at` and `phone_otp_challenges`.

It does not rewrite or uniquely constrain `users.phone`. Historical values may be null, duplicated, or not E.164. New registration and profile saves store E.164. Login matches legacy forms of the same number (`099…`, `374…`, `00…`) and refuses to sign in when more than one active user matches.

New purposes such as `CHANGE_PHONE` or `PASSWORD_RESET` can be added to the `phone_otp_purpose` enum without reusing `LOGIN` or `VERIFY_PHONE` codes.

## Safe testing

Unit tests mock MOBIPACE with a fake `fetch`. They must not call the live endpoint.

To exercise the real provider in a non-production environment, set the MOBIPACE variables and `OTP_SECRET`, then request a code for a phone you control. Do not point tests at production credentials.
