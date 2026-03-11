import type { AppAnalytics, AppsPayload, MonthlyPoint, PlayApp, ReviewBreakdown } from "@/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function wave(base: number, amp: number, shift = 0): MonthlyPoint[] {
    return MONTHS.map((month, i) => ({
        month,
        value: Math.max(0, Math.round(base + Math.sin((i + shift) * 0.8) * amp + i * base * 0.03)),
    }));
}

const STAR_COLORS = ["#22d3a6", "#3b82f6", "#a78bfa", "#f59e0b", "#f43f5e"] as const;

function mockReviews(seed: number): ReviewBreakdown[] {
    return [5, 4, 3, 2, 1].map((star, i) => ({
        stars: `${star}★`,
        count: Math.round(seed * [0.45, 0.28, 0.12, 0.08, 0.07][i]),
        fill: STAR_COLORS[i],
    }));
}

export const MOCK_APPS: PlayApp[] = [
    { packageName: "com.example.fittracker", title: "FitTracker Pro", icon: "🏃", category: "Health & Fitness" },
    { packageName: "com.example.notevault", title: "NoteVault", icon: "📝", category: "Productivity" },
    { packageName: "com.example.pixelcam", title: "PixelCam", icon: "📷", category: "Photography" },
];

const SEEDS: Record<string, number> = {
    "com.example.fittracker": 420,
    "com.example.notevault": 310,
    "com.example.pixelcam": 275,
};

function fmtK(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
}

export function getMockAnalytics(pkg: string): AppAnalytics {
    const app = MOCK_APPS.find(a => a.packageName === pkg) ?? MOCK_APPS[0];
    const s = SEEDS[pkg] ?? 350;
    const inst = wave(s * 80, s * 18, 0);
    const au = wave(s * 55, s * 12, 1);
    const rev = wave(s * 4.2, s * 1, 2);
    const rat = MONTHS.map((month, i) => ({
        month,
        value: parseFloat(Math.min(5, 3.6 + Math.sin(i * 0.6) * 0.3 + i * 0.015).toFixed(2)),
    }));
    const rb = mockReviews(s * 28);
    return {
        app,
        storageUri: `gs://pubsite_prod_rev_01234567890/stats/installs/${pkg.replace(/\./g, "_")}_202412_installs.csv`,
        kpis: {
            totalInstalls: fmtK(inst.reduce((a, p) => a + p.value, 0)),
            avgRating: (rat.reduce((a, p) => a + p.value, 0) / rat.length).toFixed(1),
            totalRevenue: "$" + fmtK(rev.reduce((a, p) => a + p.value, 0)),
            dau: fmtK(Math.round((au.at(-1)?.value ?? 0) * 0.3)),
            retentionD7: (35 + s % 28) + "%",
            reviewCount: fmtK(rb.reduce((a, r) => a + r.count, 0)),
        },
        installs: inst, activeUsers: au, revenue: rev, ratings: rat, reviewBreakdown: rb,
    };
}

export function getMockAppsPayload(): AppsPayload {
    return { apps: MOCK_APPS, storageUriBase: "gs://pubsite_prod_rev_01234567890/stats" };
}