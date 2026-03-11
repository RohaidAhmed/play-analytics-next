// ─── Domain models ────────────────────────────────────────────────────────────

export interface PlayApp {
    packageName: string;
    title: string;
    icon: string;
    category: string;
}

export interface MonthlyPoint {
    month: string;
    value: number;
}

export interface ReviewBreakdown {
    stars: string;
    count: number;
    fill: string;
}

export interface AppKpis {
    totalInstalls: string;
    avgRating: string;
    totalRevenue: string;
    dau: string;
    retentionD7: string;
    reviewCount: string;
}

export interface AppAnalytics {
    app: PlayApp;
    storageUri: string;
    kpis: AppKpis;
    installs: MonthlyPoint[];
    activeUsers: MonthlyPoint[];
    revenue: MonthlyPoint[];
    ratings: MonthlyPoint[];
    reviewBreakdown: ReviewBreakdown[];
}

// ─── API response envelope ────────────────────────────────────────────────────

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; status?: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

// ─── Endpoint-specific payloads ───────────────────────────────────────────────

export interface AppsPayload {
    apps: PlayApp[];
    storageUriBase: string;
}

export interface GcsPreviewPayload {
    uri: string;
    headers: string[];
    rows: string[][];
    total: number;
}