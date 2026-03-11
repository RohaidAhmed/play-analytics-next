/**
 * lib/playApi.ts  — SERVER ONLY
 *
 * Wraps:
 *   • Google OAuth2 JWT auth (Web Crypto, Node 18+)
 *   • Google Play Developer API  (androidpublisher v3)
 *   • Play Developer Reporting API (v1beta1)
 *   • GCS Storage URI CSV reader
 *
 * Required env vars (server-side only, never sent to browser):
 *   GOOGLE_SERVICE_ACCOUNT_JSON   full service-account JSON key
 *   PLAY_DEVELOPER_ACCOUNT_ID     numeric account id
 */

import type {
    AppAnalytics,
    AppKpis,
    MonthlyPoint,
    PlayApp,
    ReviewBreakdown,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const GCS_BUCKET_BASE = "gs://pubsite_prod_rev";
const PLAY_API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const REPORTING_API = "https://playdeveloperreporting.googleapis.com/v1beta1";

// ── OAuth2 / JWT ──────────────────────────────────────────────────────────────

interface ServiceAccountKey {
    client_email: string;
    private_key: string;
    token_uri: string;
}

interface TokenCache { token: string; expiresAt: number }
let _cache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
    const now = Date.now();
    if (_cache && _cache.expiresAt > now + 60_000) return _cache.token;

    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

    const sa: ServiceAccountKey = JSON.parse(raw);
    const iat = Math.floor(now / 1000);

    const header = b64url({ alg: "RS256", typ: "JWT" });
    const payload = b64url({
        iss: sa.client_email,
        scope: [
            "https://www.googleapis.com/auth/androidpublisher",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "https://www.googleapis.com/auth/playdeveloperreporting",
        ].join(" "),
        aud: sa.token_uri,
        iat,
        exp: iat + 3600,
    });

    const sig = await rsaSign(sa.private_key, `${header}.${payload}`);
    const jwt = `${header}.${payload}.${sig}`;

    const res = await fetch(sa.token_uri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);

    const { access_token, expires_in } =
        (await res.json()) as { access_token: string; expires_in: number };

    _cache = { token: access_token, expiresAt: now + expires_in * 1000 };
    return access_token;
}

function b64url(obj: object): string {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

async function rsaSign(pem: string, data: string): Promise<string> {
    const der = pemToDer(pem);
    const key = await globalThis.crypto.subtle.importKey(
        "pkcs8", der,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false, ["sign"],
    );
    const sig = await globalThis.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5", key,
        new TextEncoder().encode(data),
    );
    return Buffer.from(sig).toString("base64url");
}

function pemToDer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    return Buffer.from(b64, "base64").buffer as ArrayBuffer;
}

// ── Generic fetch helpers ─────────────────────────────────────────────────────

async function gFetch<T>(url: string, body?: object): Promise<T> {
    const token = await getAccessToken();
    const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`${url}: ${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
}

// ── GCS CSV reader ────────────────────────────────────────────────────────────

export async function readGcsCsv(gsUri: string): Promise<string[][]> {
    const url = gsUri.replace(/^gs:\/\//, "https://storage.googleapis.com/");
    const token = await getAccessToken();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`GCS read failed ${res.status}: ${gsUri}`);
    const text = await res.text();
    return text.trim().split("\n").map(row =>
        row.split(",").map(c => c.replace(/^"|"$/g, "").trim()),
    );
}

// ── Play Developer API ────────────────────────────────────────────────────────

type RawApp = {
    packageName: string;
    listing?: { title?: string; icon?: string };
    category?: string;
};

export async function fetchApps(accountId: string): Promise<PlayApp[]> {
    const res = await gFetch<{ applications?: RawApp[] }>(
        `${PLAY_API}/developers/${accountId}/applications`,
    );
    return (res.applications ?? []).map(a => ({
        packageName: a.packageName,
        title: a.listing?.title ?? a.packageName,
        icon: a.listing?.icon ?? "📦",
        category: a.category ?? "Unknown",
    }));
}

// ── Play Developer Reporting API ──────────────────────────────────────────────

type ReportRow = {
    dimensions: Array<{ integerValue?: string; stringValue?: string }>;
    metrics: Array<{ integerValue?: string; decimalValue?: string }>;
};

function last12MonthsRange() {
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    return { startTime: start.toISOString(), endTime: end.toISOString() };
}

const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function rowsToMonthly(rows: ReportRow[], metricIdx: number, decimal = false): MonthlyPoint[] {
    return rows.map((r, i) => ({
        month: MONTH_LABELS[i % 12],
        value: decimal
            ? parseFloat(r.metrics[metricIdx]?.decimalValue ?? "0")
            : parseInt(r.metrics[metricIdx]?.integerValue ?? "0"),
    }));
}

export async function fetchInstalls(pkg: string): Promise<MonthlyPoint[]> {
    const res = await gFetch<{ rows?: ReportRow[] }>(
        `${REPORTING_API}/apps/${pkg}/storePerformanceClusterReport:query`,
        {
            dimensions: [{ dimension: "DATE" }], metrics: [{ metric: "STORE_LISTING_VISITORS" }],
            dateRange: last12MonthsRange(), granularity: "MONTHLY"
        },
    );
    return rowsToMonthly(res.rows ?? [], 0);
}

export async function fetchActiveUsers(pkg: string): Promise<MonthlyPoint[]> {
    const res = await gFetch<{ rows?: ReportRow[] }>(
        `${REPORTING_API}/apps/${pkg}/excessiveWakeupRateMetricSet:query`,
        {
            dimensions: [{ dimension: "DATE" }], metrics: [{ metric: "ACTIVE_USERS" }],
            dateRange: last12MonthsRange(), granularity: "MONTHLY"
        },
    );
    return rowsToMonthly(res.rows ?? [], 0);
}

export async function fetchRatings(pkg: string): Promise<MonthlyPoint[]> {
    const res = await gFetch<{ rows?: ReportRow[] }>(
        `${REPORTING_API}/apps/${pkg}/ratingMetrics:query`,
        {
            dimensions: [{ dimension: "DATE" }], metrics: [{ metric: "AVERAGE_RATING" }],
            dateRange: last12MonthsRange(), granularity: "MONTHLY"
        },
    );
    return rowsToMonthly(res.rows ?? [], 0, true);
}

export async function fetchReviewBreakdown(pkg: string): Promise<ReviewBreakdown[]> {
    const COLORS = ["#22d3a6", "#3b82f6", "#a78bfa", "#f59e0b", "#f43f5e"] as const;
    const res = await gFetch<{ rows?: ReportRow[] }>(
        `${REPORTING_API}/apps/${pkg}/ratingMetrics:query`,
        {
            dimensions: [{ dimension: "STAR_RATING" }], metrics: [{ metric: "RATINGS_COUNT" }],
            dateRange: last12MonthsRange(), granularity: "OVERALL"
        },
    );
    return [5, 4, 3, 2, 1].map((star, i) => {
        const row = (res.rows ?? []).find(
            r => parseInt(r.dimensions[0]?.integerValue ?? "0") === star,
        );
        return { stars: `${star}★`, count: parseInt(row?.metrics[0]?.integerValue ?? "0"), fill: COLORS[i] };
    });
}

export async function fetchRevenue(pkg: string, accountId: string): Promise<MonthlyPoint[]> {
    const now = new Date();
    const months: MonthlyPoint[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
        const uri = `${GCS_BUCKET_BASE}_${accountId}/stats/revenue/${pkg}_${ym}_revenue.csv`;
        try {
            const rows = await readGcsCsv(uri);
            const total = rows.slice(1).reduce((s, r) => s + parseFloat(r[2] ?? "0"), 0);
            months.push({ month: MONTH_LABELS[d.getMonth()], value: Math.round(total) });
        } catch {
            months.push({ month: MONTH_LABELS[d.getMonth()], value: 0 });
        }
    }
    return months;
}

// ── KPI builder ───────────────────────────────────────────────────────────────

function fmtK(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
}

export function buildKpis(
    installs: MonthlyPoint[], au: MonthlyPoint[],
    revenue: MonthlyPoint[], ratings: MonthlyPoint[],
    reviews: ReviewBreakdown[],
): AppKpis {
    const sum = (a: MonthlyPoint[]) => a.reduce((s, p) => s + p.value, 0);
    const avg = (a: MonthlyPoint[]) => a.length ? sum(a) / a.length : 0;
    return {
        totalInstalls: fmtK(sum(installs)),
        avgRating: avg(ratings).toFixed(1),
        totalRevenue: "$" + fmtK(sum(revenue)),
        dau: fmtK(Math.round((au.at(-1)?.value ?? 0) * 0.3)),
        retentionD7: "—",
        reviewCount: fmtK(reviews.reduce((s, r) => s + r.count, 0)),
    };
}

export async function buildAppAnalytics(app: PlayApp, accountId: string): Promise<AppAnalytics> {
    const [installs, activeUsers, revenue, ratings, reviewBreakdown] = await Promise.all([
        fetchInstalls(app.packageName),
        fetchActiveUsers(app.packageName),
        fetchRevenue(app.packageName, accountId),
        fetchRatings(app.packageName),
        fetchReviewBreakdown(app.packageName),
    ]);
    return {
        app,
        storageUri: `${GCS_BUCKET_BASE}_${accountId}/stats/installs/${app.packageName.replace(/\./g, "_")}_installs.csv`,
        kpis: buildKpis(installs, activeUsers, revenue, ratings, reviewBreakdown),
        installs, activeUsers, revenue, ratings, reviewBreakdown,
    };
}