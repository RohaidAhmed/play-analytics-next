# Play Analytics Dashboard — Next.js 14

TypeScript full-stack analytics dashboard for Google Play Store, built with **Next.js 14 App Router**.

---

## Stack

| Layer    | Tech |
|----------|------|
| Framework | Next.js 16 (App Router) |
| Language  | TypeScript |
| UI        | React 19 + Recharts |
| Fonts     | `next/font/google` — Syne + Space Mono |
| API       | Next.js Route Handlers (`app/api/*/route.ts`) |
| Auth      | Google OAuth2 JWT (Web Crypto, no extra libs) |
| Data      | Play Developer API + Reporting API + GCS Storage URIs |

---

## Project Structure

```
play-analytics-next/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── apps/route.ts          GET /api/apps
│   │   │   ├── analytics/route.ts     GET /api/analytics?packageName=...
│   │   │   └── gcs-preview/route.ts   GET /api/gcs-preview?uri=gs://...
│   │   ├── globals.css
│   │   ├── layout.tsx                 Fonts + metadata
│   │   └── page.tsx                   → renders <Dashboard />
│   ├── components/
│   │   ├── Dashboard.tsx              "use client" — main interactive shell
│   │   ├── KpiCard.tsx
│   │   ├── ChartHelpers.tsx           SectionTitle, ChartCard, CustomTooltip
│   │   ├── ChartTabs.tsx              InstallsTab, RatingsTab, RevenueTab
│   │   └── GcsPreviewPanel.tsx        Interactive GCS URI → CSV preview
│   ├── hooks/
│   │   └── usePlayData.ts             useApps, useAnalytics, useGcsPreview
│   ├── lib/
│   │   ├── api.ts                     Client-side fetch wrappers
│   │   ├── playApi.ts                 Server-only: JWT auth + Play/GCS API
│   │   └── mockData.ts                Mock data for local dev
│   └── types/
│       └── index.ts                   Shared types
├── next.config.ts
└── .env.example
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/apps` | List all apps in the developer account |
| `GET` | `/api/analytics?packageName=<pkg>` | Full analytics bundle (installs, users, revenue, ratings, reviews) |
| `GET` | `/api/gcs-preview?uri=gs://...` | Preview CSV rows from a GCS export URI |

All routes are **server-only** — credentials never reach the browser.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Service account JSON (server-only, never exposed to browser)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Your Play Console numeric account ID
PLAY_DEVELOPER_ACCOUNT_ID=0123456789

# Use mock data locally (no credentials needed)
NEXT_PUBLIC_USE_MOCK=true
```

### 3. Google Cloud permissions

Your service account needs:
- `Android Management API` scope (`androidpublisher`)
- `Play Developer Reporting API` scope
- `Storage Object Viewer` role on the GCS export bucket

### 4. Run locally

```bash
# Mock mode (no credentials needed)
NEXT_PUBLIC_USE_MOCK=true npm run dev

# Real API mode
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel deploy
```

Set env vars in **Vercel dashboard → Settings → Environment Variables**:
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `PLAY_DEVELOPER_ACCOUNT_ID`

---

## GCS Storage URI Pattern

Play Console exports stats to:

```
gs://pubsite_prod_rev_<ACCOUNT_ID>/stats/<metric>/<pkg>_<YYYYMM>_<country>_<metric>.csv
```

The **GCS Preview Panel** lets you paste any `gs://` URI and inspect CSV rows directly in the dashboard.

---

## Key Architectural Decisions

- **`lib/playApi.ts` is server-only** — imported only by route handlers, never shipped to the browser
- **JWT auth uses Web Crypto** (Node 18+) — zero extra dependencies for signing
- **`NEXT_PUBLIC_USE_MOCK=true`** bypasses all API calls with deterministic mock data
- **Route handlers include `Cache-Control` headers** so Vercel's CDN edge-caches analytics responses for 6 hours
- **`next/font/google`** loads Syne + Space Mono with zero layout shift