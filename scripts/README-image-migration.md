# External image migration

Makes the site independent of the legacy media hosts (`digitalageexpo.com`,
`apps.digitalageexpo.com`, `findusonweb.com`, `tradeshowslocal.com`) by mirroring
every referenced image/video into `public/images/external/**` and serving it from
Vercel.

```
EXTERNAL IMAGE URL -> download -> public/images/external/... -> /images/external/... -> Vercel
```

---

## Why images were breaking

`src/lib/assets.ts` used to build every image URL as `ASSETS_BASE_URL + filename`.

| Environment | `NEXT_PUBLIC_ASSETS_BASE_URL` | Result |
|---|---|---|
| Local | unset → `http://localhost/findusonweb` | worked only if you had a XAMPP copy of the legacy site |
| Vercel | the legacy host | broke whenever that host's TLS cert or CDN misbehaved |

It also mangled genuinely-local paths: `/images/visualytes.png` became
`http://localhost/findusonweb/images/visualytes.png`.

Both problems are fixed by resolving assets locally. **The database is not the
problem and mostly does not need to change** — it stores filenames, and only the
*resolution rule* moved.

---

## The three moving parts

| File | Role |
|---|---|
| `src/lib/asset-map.ts` | Pure, dependency-free mapping. Single source of truth. |
| `src/lib/assets.ts` | Runtime helpers (`assetUrl`, `staticAssetUrl`, `lobbyAssetUrl`, …) |
| `scripts/download-external-images.ts` | One-time migration; imports the same map |

The script imports the map the app uses, so the path it **writes** is always the
path the app **reads**.

### Mapping rules

| Legacy reference | Local path |
|---|---|
| `https://digitalageexpo.com/files/listing_pages/817601-tillu_white.png` | `/images/external/listing_pages/817601-tillu_white.png` |
| `https://apps.digitalageexpo.com/images/speaker_hall.png` | `/images/external/apps/speaker_hall.png` |
| `https://digitalageexpo.com/images/get_ticket.mp4` | `/images/external/site/get_ticket.mp4` |
| `files/lobby/child/event_327.jpg` (bare DB value) | `/images/external/lobby/child/event_327.jpg` |
| `/images/logo.png` | unchanged — already local |
| `/files/settings/branding_favicon.ico` | unchanged — CP upload folder |
| `https://youtube.com/…` | unchanged — deliberate third-party link |
| `null` / `undefined` / `""` / `"   "` | `undefined` |

`assetUrl()` is **idempotent** — feeding it an already-resolved path, a `blob:`
preview URL or a third-party URL returns the input untouched. That makes it safe
to wrap any image expression.

---

## Running it

```bash
npm install
npx prisma generate

# 1. AUDIT ONLY — reads code + database, writes nothing anywhere
npx tsx scripts/download-external-images.ts audit

# 2. DOWNLOAD — fetches + verifies every asset into public/images/external
npx tsx scripts/download-external-images.ts download --insecure

# 3. Review reports/, then build and check the site
npm run build && npm run dev

# 4. OPTIONAL — only if the audit shows DB rows holding *absolute* legacy URLs
npx tsx scripts/download-external-images.ts update-db            # dry run + backup
npx tsx scripts/download-external-images.ts update-db --confirm  # apply
```

`verify` re-checks everything already on disk:

```bash
npx tsx scripts/download-external-images.ts verify
```

### Flags

| Flag | Default | Meaning |
|---|---|---|
| `--insecure` | off | Accept invalid TLS certs — **legacy hosts only** (see below) |
| `--concurrency=N` | 6 | Parallel downloads |
| `--timeout=MS` | 30000 | Per-request timeout |
| `--retries=N` | 3 | Retries for *transient* failures only (never for 404/cert errors) |
| `--max-bytes=N` | 52428800 | Skip anything larger (50 MB) |
| `--skip-video` | off | Don't mirror `.mp4/.webm/.mov/.ogv/.m4v` |
| `--full-scan` | off | Scan every text column, not just image-named ones |
| `--no-db` | off | Source-code scan only |
| `--force` | off | Re-download even if a valid local file exists |
| `--confirm` | off | Required by `update-db` |

---

## ⚠️ About `--insecure`

The legacy hosts have intermittently served an expired/mismatched certificate.
`--insecure` sets `rejectUnauthorized: false` **for requests made by this script
only**, and **only for hosts in `LEGACY_MEDIA_HOSTS`** — any other host is still
validated normally even with the flag on.

This is acceptable because it is a one-time, operator-run migration against
project-owned servers, and every downloaded byte is validated afterwards by
magic-byte sniffing (not by trusting `Content-Type`).

It is **not** acceptable anywhere else:

- the script never sets `NODE_TLS_REJECT_UNAUTHORIZED`
- `next.config.ts` contains no insecure TLS settings
- no `fetch`/`axios`/runtime code disables certificate validation

---

## Outputs

| File | Contents |
|---|---|
| `reports/image-audit.json` | Every reference found, with table/column/record id or file/line |
| `reports/image-audit.csv` | Same, spreadsheet-friendly |
| `reports/image-manifest.json` | `sourceUrl → localPath → status` for every unique asset |
| `reports/failed-image-downloads.json` | Failures with url, error, table, record id, field |
| `reports/db-backup-<ts>.json` | Full copy of every affected row, written **before** `update-db` applies anything |
| `src/lib/asset-overrides.generated.ts` | Duplicate → existing-local-file map (generated) |

Manifest statuses: `downloaded`, `already-local`, `mapped-existing`, `skipped`, `failed`.

### Validation

A response is only accepted if the bytes actually *are* an image/video. The
script sniffs PNG / JPEG / GIF / WEBP / BMP / ICO / TIFF / AVIF / SVG / MP4 /
WEBM signatures and rejects HTML error pages, JSON and empty bodies — a server
returning `text/html` for a `.png` URL is a **failure**, not a download.

### De-duplication (sponsor logos)

After downloading, each asset's SHA-256 is compared against every file already in
`public/images`. If they are byte-identical, the duplicate is **not** written;
instead an entry goes into `src/lib/asset-overrides.generated.ts` so `assetUrl()`
resolves to the image you already ship:

```
/images/external/listing_pages/817601-tillu_white.png  ->  /images/tillu_white.png
```

Filenames are never used as evidence of sameness — only content hashes.

Nothing already in `public/images` is ever deleted, renamed or overwritten.

---

## Database policy

| Stored value | Action |
|---|---|
| Bare filename (`817601-tillu_white.png`, `files/lobby/x.jpg`) | **No DB change.** `assetUrl()` resolves it locally. |
| Absolute legacy URL (`https://digitalageexpo.com/files/...`) | `update-db` rewrites it to the local path |

`update-db`:

- writes a full JSON backup of every affected row **first**
- is a **dry run** without `--confirm`
- only touches rows whose image downloaded **and** passed verification — a
  failed download leaves the row alone
- guards each `UPDATE` on the old value and runs in a single transaction
- never deletes anything

Components stay dynamic throughout — the database remains the source of the
image reference.

---

## Missing images

`src/components/common/SafeImage.tsx` exports `SafeImage` (next/image) and
`SafeImg` (plain `<img>`). Both resolve through `assetUrl()` and fall back to
`/images/image-placeholder.png` instead of a broken-image icon, and log a console
warning in development. This hides the symptom in the UI only — the failure is
still recorded in `reports/failed-image-downloads.json`.

---

## Verifying the result

```bash
npm run build
npm run dev
```

Open DevTools → Network → Img. There must be **no** requests to
`digitalageexpo.com`, `apps.digitalageexpo.com`, `findusonweb.com` or
`tradeshowslocal.com`. Pages worth checking: home (hero, sponsors, about),
`/event_features`, `/why_join_exhibit`, `/glimpse-of-the-show`, `/sponsors`,
`/exhibitor-registration`, `/virtual-event/[slug]`, `/view_gallery`, `/magazine`.

After deploying, each mirrored file must return HTTP 200:

```
https://<your-domain>/images/external/apps/speaker_hall.png
https://<your-domain>/images/tillu_white.png
```

Re-scan for leftovers at any time:

```bash
grep -rn "digitalageexpo.com\|apps.digitalageexpo.com\|tradeshowslocal.com\|findusonweb.com" src/ \
  | grep -v staticAssetUrl
```

Remaining hits should only be website links, social links, API endpoints or
`asset-map.ts`'s own host list — never an image URL.

---

## Reminder

`public/images/...` is served at `/images/...` — never `/public/images/...`.
