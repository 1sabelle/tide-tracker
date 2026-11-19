# Spec: syncing data between devices

Status: proposed, not started (written 2026-11-19).

## Goal

Use Tide on several devices (phone, laptop) and see the same logs and settings on each, without giving up
what the localStorage-only version gets right: instant start-up, offline use and data nobody else can read.

## Non-goals

- Several people sharing one account, or sharing data with a partner or doctor.
- Real-time sync between two open tabs. Syncing on open and shortly after edits is enough.
- Server-side features that need to read the data (reminders, analytics). The server only stores ciphertext.

## Overview

Everything runs on the Cloudflare account that already hosts `tide.belle.fyi`.

| Piece | Cloudflare product | Job |
|---|---|---|
| Login | Zero Trust **Access** | Only lets allowed emails reach the site and the API. No login code in the app. |
| API | **Pages Functions** (`functions/api/data.js`) | `GET` and `PUT` one encrypted document per user. |
| Storage | **Workers KV** | Holds that document, keyed by the user's email. |
| Encryption | Browser **Web Crypto** | Encrypts before upload and decrypts after download. The key never leaves the device. |

localStorage stays the app's working copy. The server is a sync point, not the only copy.

## Login: Cloudflare Access

- Create an Access application for `tide.belle.fyi` **and** `tide-tracker.pages.dev` (plus preview
  subdomains, `*.tide-tracker.pages.dev`). Protecting only the custom domain would leave the API open
  through the `pages.dev` address.
- Policy: allow the owner's email, one-time PIN login. Session length 1 month so phones do not log out constantly.
- The Function must **verify the `Cf-Access-Jwt-Assertion` JWT** (signature against the team's public keys at
  `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, plus the application AUD) and take the email
  from the verified token. It must not trust the `Cf-Access-Authenticated-User-Email` header on its own.

## API

One document per user, at KV key `user:<email>`.

```
GET /api/data
  200 { version, envelope }     // stored document
  404                           // nothing stored yet
  401                           // no valid Access token

PUT /api/data
  body    { baseVersion, envelope }
  200     { version }           // saved; version is the new one
  409     { version, envelope } // someone saved since baseVersion: merge and retry
  413                           // body over the size limit (256 KB is plenty; a year of logs is ~50 KB)
```

`version` is a counter the Function increments on every save. A `PUT` with a `baseVersion` that is not the
stored version is rejected with `409`, so two devices can never silently overwrite each other.

KV has no compare-and-swap, so two `PUT`s landing at the same instant could still race. For one person on a
few devices that is acceptable. If it ever matters, move the document to D1 or a Durable Object.

## Encryption

- The user chooses a **sync passphrase** the first time they turn sync on, on any device.
- Key: PBKDF2-SHA-256 over the passphrase, 600,000 iterations, random 16-byte salt, giving an AES-GCM 256-bit key.
- Each save encrypts the whole document JSON with a fresh random 12-byte IV.
- Stored envelope: `{ format: 1, salt, iv, ciphertext }` (base64). The salt stays the same for the account;
  the IV changes every save.
- The derived key is kept on the device as a **non-extractable `CryptoKey` in IndexedDB**, so the
  passphrase is asked for once per device, not on every visit.
- A wrong passphrase shows up as an AES-GCM decryption failure: show "wrong passphrase", never overwrite
  the server copy.
- **There is no recovery.** A forgotten passphrase makes the server copy unreadable. Local data and exported
  backups are unaffected, and sync can be reset by uploading the local data under a new passphrase. The UI
  must say this plainly when the passphrase is chosen.

## Data model changes

Merging needs to know which version of each day is newer, and that a day was cleared rather than never logged.

```js
{
  logs: {
    '2026-11-18': { ...dayLog, updatedAt: 1763460000000 },
    '2026-11-17': { deleted: true, updatedAt: 1763450000000 },  // tombstone
  },
  settings: { cycleLength, periodLength, lutealLength, updatedAt },
}
```

- `updatedAt` is set by the device when the user edits that day (milliseconds since epoch).
- Clearing a day (today `isEmptyLog` deletes the key) writes a **tombstone** instead, so the deletion
  reaches other devices. Tombstones older than 90 days can be dropped.
- Everything that reads logs (`findPeriods`, Calendar, Patterns, export) must skip tombstones. The simplest
  way is to strip them in one place when loading into app state, and add them back when saving.
- `storage.js` `parseData` must accept and keep `updatedAt` and tombstones; old data without them loads as
  `updatedAt: 0`.

## Merge rule

Per day: the entry with the larger `updatedAt` wins; tombstones take part like any other entry. Settings
merge the same way as one unit. This is a pure function, `mergeData(local, remote)`, and is where most of
the tests go.

Clock skew between devices only matters if the same day is edited on two devices within the skew, which is
rare enough to accept.

## Sync flow

1. **On open:** load localStorage as today and render immediately. Then `GET`, decrypt, `mergeData`, save the
   result locally, and `PUT` it if it differs from what the server had.
2. **After an edit:** save locally at once (as today). Debounce about 2 seconds, then `PUT` with the last known
   `version`. On `409`, merge with the returned document and retry once.
3. **Offline or failed request:** keep working locally, mark "not synced", retry on the next edit, on
   `online` events and when the tab becomes visible.
4. **Import JSON:** replaces local data as today, with every day stamped `updatedAt: now` so it wins the merge.

## UI

In "Settings and data", a **Sync** block:

- Off: "Sync between devices" button, then the passphrase setup with the no-recovery warning.
- On: status line ("Synced 2 minutes ago", "Not synced: offline", "Wrong passphrase on this device"), and a
  "Turn off sync on this device" action that forgets the key but keeps local data.

## First-time migration

On the first device, turning sync on stamps all existing days with `updatedAt: now` and uploads them. On each
further device, local data (if any) is merged with the server copy rather than replaced, so nothing logged
on the device before sync is lost.

## Setup steps in the Cloudflare dashboard

1. Workers & Pages > KV: create a namespace `tide-data`.
2. Pages project `tide-tracker` > Settings > Bindings: bind it as `TIDE_DATA` (production and preview).
3. Zero Trust > Access > Applications: self-hosted app covering the hostnames listed under *Login*, with an
   allow policy for the owner's email and one-time PIN.
4. Note the team domain and the application AUD tag; add both as Pages environment variables
   (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`) for the JWT check.

## Testing

- Unit: `mergeData` (newer wins, tombstones, settings, data without `updatedAt`), envelope encrypt and decrypt
  round trip, wrong-passphrase failure, `parseData` with the new fields.
- Function: missing or invalid JWT gives 401, stale `baseVersion` gives 409, oversized body gives 413.
- Manual: two browsers logged in, edit different days offline on each, reconnect, both end up with both edits.

## Rough effort

About a day of work including tests, plus the dashboard steps above.

## Open questions

- Should the sync passphrase also encrypt exported JSON backups? It would protect backup files, but makes
  them unreadable if the passphrase is lost.
- Keep localStorage, or move the local copy to IndexedDB at the same time (more space, and Safari treats it
  the same for the 7-day eviction rule)?
